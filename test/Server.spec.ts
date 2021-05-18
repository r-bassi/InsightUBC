import Server from "../src/rest/Server";

import Log from "../src/Util";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import * as fs from "fs-extra";
import {ServerTestUtil} from "./ServerTestUtil";

describe("Facade D3", function () {
    const datasetsToLoad: { [id: string]: string } = {
        smallcourses: "./test/data/smallcourses.zip",
        smallrooms: "./test/data/smallrooms.zip",
        rooms: "./test/data/rooms.zip",
    };

    let datasets: { [id: string]: Buffer } = {};

    let server: Server = null;
    let address: string = null;

    chai.use(chaiHttp);

    before(function (done) {
        Log.test(`Before all`);

        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]);
        }

        server = new Server(4321);
        address = "http://localhost:4321";
        server
            .start()
            .then(() => {
                done();
            });
    });

    after(function (done) {
        server
            .stop()
            .then(() => {
                done();
            });
    });

    beforeEach(function (done) {
        Log.test("beforeEach");

        Server.facade.listDatasets()
            .then((array) => {
                Log.test(array);
                array.forEach((dataset) => {
                    Log.test("beforeEach remove dataset: " + dataset.id);
                    Server.facade.removeDataset(dataset.id);
                });
                done();
            });
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    it("PUT small courses dataset", function () {
        let id: string = "smallcourses";
        let kind: string = "courses";

        try {
            return ServerTestUtil.putDataset(address, id, kind, datasets[id])
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({
                        result: [id]
                    });
                });
        } catch (err) {
            expect.fail();
        }
    });

    it("PUT small rooms dataset", function () {
        let id: string = "smallrooms";
        let kind: string = "rooms";

        try {
            return ServerTestUtil.putDataset(address, id, kind, datasets[id])
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({
                        result: [id]
                    });
                });
        } catch (err) {
            expect.fail();
        }
    });

    it("PUT invalid dataset type", function () {
        let id: string = "smallrooms";
        let kind: string = "invalid";

        try {
            return ServerTestUtil.putDataset(address, id, kind, datasets[id])
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err: any) {
                    expect(err.status).to.be.equal(400);
                    expect(err.response.res.body).to.deep.equal({
                        error: InsightFacade.invalidType
                    });
                });
        } catch (err) {
            expect.fail();
        }
    });

    it("PUT invalid dataset id", function () {
        let id: string = "smallcourses";
        let kind: string = "courses";

        try {
            return ServerTestUtil.putDataset(address, "invalid_dataset", kind, datasets[id])
                .then(function () {
                    expect.fail();
                })
                .catch(function (err: any) {
                    expect(err.status).to.be.equal(400);
                    expect(err.response.res.body).to.deep.equal({
                        error: InsightFacade.invalidIdUnderscore
                    });
                });
        } catch (err) {
            expect.fail();
        }
    });

    it("PUT two datasets with the equal id", function () {
        let id: string = "smallrooms";
        let kind: string = "rooms";

        try {
            return ServerTestUtil.putDataset(address, id, kind, datasets[id])
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({
                        result: [id]
                    });
                })
                .then(function () {
                    return ServerTestUtil.putDataset(address, id, kind, datasets[id])
                        .then(function () {
                            expect.fail();
                        })
                        .catch(function (err: any) {
                            expect(err.status).to.be.equal(400);
                            expect(err.response.res.body).to.deep.equal({
                                error: InsightFacade.invalidDatasetExists
                            });
                        });
                });
        } catch (err) {
            expect.fail();
        }
    });

    it("GET empty datasets", function () {
        try {
            chai.request(address)
                .get("/datasets")
                .end((err, res) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({
                        result: []
                    });
                });
        } catch (err) {
            expect.fail();
        }
    });

    it("PUT/GET shutdown - disk persistence", function () {
        let id: string = "rooms";
        let kind: string = "rooms";

        try {
            return ServerTestUtil.putDataset(address, id, kind, datasets[id])
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({
                        result: [id]
                    });
                })
                .then(function () {
                    // shut down
                    server.stop();
                })
                .then(function () {
                    server.start();
                })
                .then(function () {
                    return chai.request(address)
                        .get("/datasets");
                })
                .then((res: Response) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({
                        result: [{
                            id: id,
                            kind: kind,
                            numRows: 364,
                        }]
                    });
                })
                .catch(function () {
                    expect.fail();
                });
        } catch (err) {
            expect.fail();
        }
    });

    // wrong end point test

    it("PUT/DELETE attempt to delete the same dataset twice", function () {
        let id: string = "smallrooms";
        let kind: string = "rooms";

        return ServerTestUtil.putDataset(address, id, kind, datasets[id])
            .then(() => {
                return chai.request(address)
                    .del(`/dataset/${id}`);
            })
            .then((res: Response) => {
                expect(res.status).to.be.equal(200);
                expect(res.body).to.deep.equal({
                    result: id
                });
            })
            .then(() => {
                return chai.request(address)
                    .del(`/dataset/${id}`)
                    .then(() => {
                        expect.fail();
                    })
                    .catch((err) => {
                        expect(err.status).to.be.equal(404);
                        expect(err.response.res.body).to.deep.equal({
                            error: InsightFacade.invalidDoesNotExist
                        });
                    });
            })
            .catch((err) => {
                Log.test(err);
                expect.fail();
            });
    });

    it("PUT/DELETE multiple datasets", function () {
        let id: string = "smallrooms";
        let kind: string = "rooms";

        return ServerTestUtil.putDataset(address, "first", kind, datasets[id])
            .then(() => {
                return ServerTestUtil.putDataset(address, "second", kind, datasets[id]);
            })
            .then(() => {
                return chai.request(address)
                    .del(`/dataset/${"first"}`);
            })
            .then((res: Response) => {
                expect(res.status).to.be.equal(200);
                expect(res.body).to.deep.equal({
                    result: "first"
                });
            })
            .then(() => {
                return chai.request(address)
                    .del(`/dataset/${"second"}`);
            })
            .then((res: Response) => {
                expect(res.status).to.be.equal(200);
                expect(res.body).to.deep.equal({
                    result: "second"
                });
            })
            .catch((err) => {
                Log.test(err);
                expect.fail();
            });
    });

    it("PUT/GET multiple datasets", function () {
        let id: string = "smallrooms";
        let kind: string = "rooms";

        try {
            return ServerTestUtil.putDataset(address, "first", kind, datasets[id])
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.be.members(["first"]);
                    return ServerTestUtil.putDataset(address, "second", kind, datasets[id]);
                })
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.be.members(["first", "second"]);
                })
                .then(function () {
                    return chai.request(address)
                        .get("/datasets");
                })
                .then((res: Response) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.have.deep.members([{
                        id: "first",
                        kind: kind,
                        numRows: 45,
                    }, {
                        id: "second",
                        kind: "rooms",
                        numRows: 45,
                    }]);
                })
                .catch(function (err) {
                    Log.test(err);
                    expect.fail();
                });
        } catch (err) {
            expect.fail();
        }
    });

    it("DELETE id contains underscore - 400 error", function () {
        let id: string = "contains_underscore";

        return chai.request(address)
            .del(`/dataset/${id}`)
            .then(function () {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err.status).to.be.equal(400);
                expect(err.response.res.body).to.deep.equal({
                    error: InsightFacade.invalidIdUnderscore
                });
            });
    });

    it("DELETE id does not exist - 404 error", function () {
        let id: string = "doesnotexist";

        return chai.request(address)
            .del(`/dataset/${id}`)
            .then(function () {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err.status).to.be.equal(404);
                expect(err.response.res.body).to.deep.equal({
                    error: InsightFacade.invalidDoesNotExist
                });
            });
    });

    it("PUT/DELETE add dataset and remove dataset - 200 status", function () {
        let id: string = "smallrooms";
        let kind: string = "rooms";

        try {
            return ServerTestUtil.putDataset(address, id, kind, datasets[id])
                .then(function () {
                    return chai.request(address)
                        .del(`/dataset/${id}`)
                        .then(function (res: Response) {
                            expect(res.status).to.be.equal(200);
                            expect(res.body).to.deep.equal({
                                result: id
                            });
                        });
                })
                .catch(function () {
                    expect.fail();
                });
        } catch (err) {
            expect.fail();
        }
    });

    it("PUT/POST add dataset, shutdown server, start up server, post query - 200 status", function () {
        let id: string = "rooms";
        let kind: string = "rooms";

        let t: any = JSON.parse(fs.readFileSync("./test/queries/rooms-test/rooms-complex.json", {encoding: "utf8"}));
        let query: any = t.query;
        let r: any = t.result;

        try {
            return ServerTestUtil.putDataset(address, id, kind, datasets[id])
                .then(function () {
                    return server.stop();
                })
                .then(function () {
                    return server.start();
                })
                .then(function () {
                    return chai.request(address)
                        .post("/query")
                        .send(JSON.stringify(query));
                })
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                    expect(res.body.result).to.deep.include.members(r);
                })
                .catch(function (err) {
                    expect.fail();
                });
        } catch (err) {
            expect.fail();
        }
    });

    it("PUT/POST add dataset, post invalid query - 400 status", function () {
        let id: string = "rooms";
        let kind: string = "rooms";

        let t: any = JSON.parse(fs.readFileSync("./test/queries/invalid/GroupString.json", {encoding: "utf8"}));
        let query: any = t.query;

        try {
            return ServerTestUtil.putDataset(address, id, kind, datasets[id])
                .then(function () {
                    return chai.request(address)
                        .post("/query")
                        .send(JSON.stringify(query));
                })
                .then(function () {
                    expect.fail();
                })
                .catch(function (err) {
                    expect(err.status).to.be.equal(400);
                    expect(err.response.res.body).to.include.all.keys("error");
                });
        } catch (err) {
            expect.fail();
        }
    });
});
