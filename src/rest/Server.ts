/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
import InsightFacade from "../controller/InsightFacade";
import {NotFoundError} from "../controller/IInsightFacade";

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;

    public static facade: InsightFacade;

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
        Server.facade = new InsightFacade();
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Log.info("Server::start() - start");

                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({mapFiles: true, mapParams: true}));
                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });

                // This is an example endpoint that you can invoke by accessing this URL in your browser:
                // http://localhost:4321/echo/hello
                that.rest.get("/echo/:msg", Server.echo);

                // NOTE: your endpoints should go here
                that.rest.put("/dataset/:id/:kind", Server.putDataset);
                that.rest.del("/dataset/:id", Server.deleteDataset);
                that.rest.post("/query", Server.postQuery);
                that.rest.get("/datasets", Server.getDatasets);

                // This must be the last endpoint!
                that.rest.get("/.*", Server.getStatic);

                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });

                that.rest.on("error", function (err: string) {
                    // catches errors in restify start; unusual syntax due to internal
                    // node not using normal exceptions here
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });

            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }

    private static putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::putDataset(..)");

        let contentType: boolean = req.getContentType() === "application/x-zip-compressed";
        let containsId: boolean = req.params.hasOwnProperty("id");
        let containsKind: boolean = req.params.hasOwnProperty("kind");

        if (!contentType || !containsId || !containsKind) {
            res.json(400, {error: "incorrect content type or missing id / kind parameters"});
            return next();
        }

        let content: string;
        try {
            content = req.body.toString("base64");
        } catch (err) {
            res.json(400, {error: err.message});
            return next();
        }

        Server.facade.addDataset(req.params.id, content, req.params.kind)
            .then((arr) => {
                res.json(200, {result: arr});
                return next();
            })
            .catch((err) => {
                res.json(400, {error: err.message});
                return next();
            });
    }

    private static deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::deleteDataset(..)");

        try {
            Server.facade.removeDataset(req.params.id)
                .then((id) => {
                    res.json(200, {result: id});
                    return next();
                })
                .catch((err) => {
                    if (err instanceof NotFoundError) {
                        res.json(404, {error: err.message});
                    } else {
                        res.json(400, {error: err.message});
                    }
                    return next();
                });
        } catch (err) {
            res.json(400, {err: err.message});
            return next();
        }
    }

    private static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::postQuery(..)");

        let myjson: any;
        try {
            myjson = JSON.parse(req.body);
        } catch (err) {
            res.json(400, {error: err.message});
            return next();
        }

        Server.facade.performQuery(myjson)
            .then((arr) => {
                res.json(200, {result: arr});
                return next();
            })
            .catch((err) => {
                res.json(400, {error: err.message});
                return next();
            });
    }

    private static getDatasets(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::getDatasets(..)");

        Server.facade.listDatasets()
            .then((arr) => {
                res.json(200, {result: arr});
                return next();
            });
    }

    // The next two methods handle the echo service.
    // These are almost certainly not the best place to put these, but are here for your reference.
    // By updating the Server.echo function pointer above, these methods can be easily moved.
    private static echo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Log.info("Server::echo(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err});
        }
        return next();
    }

    private static performEcho(msg: string): string {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        } else {
            return "Message not provided";
        }
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

}
