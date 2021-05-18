import {InsightError} from "./IInsightFacade";
import {type} from "os";

export abstract class CheckQuery {
    private static QUERYKeys = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
    private static OPTIONSKeys = ["COLUMNS", "ORDER"];
    private static LOGICKeys = ["AND", "OR"];
    private static MCOMPARATORKeys = ["LT", "GT", "EQ", "IS"];
    private static MCOMPARATORMin = ["LT", "GT", "EQ"];
    private static NEGATIONKeys = ["NOT"];
    private static DIRECTION = ["UP", "DOWN"];
    private static APPLYTOKEN = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
    private static SORTORDER = ["dir", "keys"];
    private pquery: any;
    private id: string;
    public transform: boolean;

    constructor(pquery: any, id: string) {
        this.pquery = pquery;
        this.id = id;
        this.transform = false;
    }

    public abstract checkMFields(str: string): any;
    public abstract checkSFields(str: string): any;
    public abstract checkStringField(str: string): any;
    public abstract checkAllKeys(str: string): any;

    public validPQ() {
        // syntax checks
        if (!Object.keys(this.pquery).includes(CheckQuery.QUERYKeys[0])) {
            throw new InsightError("Query missing WHERE");
        }
        if (!Object.keys(this.pquery).includes(CheckQuery.QUERYKeys[1])) {
            throw new InsightError("Query missing OPTIONS");
        }
        if (this.pquery.length !== undefined) {
            throw new InsightError("Query cannot be an arr");
        }
        if (typeof this.pquery !== "object") {
            throw new InsightError("Query should be an object");
        }
        if (this.pquery === null) {
            throw new InsightError("Query cannot be null");
        }
        // where clause checks
        let where = this.pquery["WHERE"];

        if (where === null) {
            throw new InsightError("WHERE should not be null");
        }
        if (typeof where !== "object") {
            throw new InsightError("WHERE should be an obj");
        }
        if (Object.keys(where).length > 1) {
            throw new InsightError("WHERE should have one key");
        }
        this.checkValidKeys(where);
        if (Object.keys(this.pquery).includes(CheckQuery.QUERYKeys[2])) {
            this.transform = true;
            this.checkValidTransformations(this.pquery);
        }
        this.validOptionsOrder(this.pquery[CheckQuery.QUERYKeys[1]]);
    }

    // checks the keys of MCOMPARATOR, LOGIC, and NEGATION
    private checkValidKeys(object: any) {
        if (CheckQuery.MCOMPARATORKeys.includes(Object.keys(object)[0])) {
            this.checkValidMS(object, Object.keys(object)[0]);
        } else if (CheckQuery.LOGICKeys.includes(Object.keys(object)[0])) {
            this.checkValidLogic(object, Object.keys(object)[0]);
        } else if (CheckQuery.NEGATIONKeys.includes(Object.keys(object)[0])) {
            this.checkValidNegation(object, Object.keys(object)[0]);
        }
    }

    // The key is Object.keys(object[str])[0]
    private checkValidMS(object: any, str: string) {
        // if (((Object.keys(object[str])[0]).split("_"))[0] !== this.id) {
        //     throw new InsightError("Dataset id is invalid");
        // }
        if (Object.keys(object[str]).length !== 1) {
            throw new InsightError("Check that there is only one key");
        }
        if ((Object.keys(object[str])[0].split("_")).length >= 3) {
            throw new InsightError("More than two underscores");
        }

        if (CheckQuery.MCOMPARATORMin.includes(str)) {
            if (typeof object[str][Object.keys(object[str])[0]] !== "number") {
                throw new InsightError("Comparison should be to a number");
            }

            this.checkMFields(((Object.keys(object[str])[0]).split("_"))[1]);
        }

        if (!CheckQuery.MCOMPARATORMin.includes(str)) {
            this.checkSFields(((Object.keys(object[str])[0]).split("_"))[1]);
            if (typeof object[str][Object.keys(object[str])[0]] !== "string") {
                throw new InsightError("Invalid field type");
            }

        }

    }


    private checkValidLogic(object: any, str: string) {
        let allObj = object[str];
        if (allObj.length === 0) {
            throw new InsightError("There must be a logic gate");
        }
        if (!Array.isArray(allObj)) {
            throw new InsightError("Logic should be an array");
        }
        for (let j in allObj) {
            if (1 === Object.keys(allObj[j]).length) {
                this.checkValidKeys(allObj[j]);
            } else {
                throw new InsightError("Logic objects must have one key");
            }
        }
    }

    private checkValidNegation(object: any, str: string) {
        let allObj = object[str];
        if (Object.keys(allObj).length === 0) {
            throw new InsightError("Negation must have a key");
        }
        if (Object.keys(allObj).length >= 2) {
            throw new InsightError("Negation must have only one key");
        }
        this.checkValidKeys(allObj);
    }

    private validOptionsOrder(options: any) {
        // COLUMNS
        if (!Object.keys(options).includes(CheckQuery.OPTIONSKeys[0])) {
            throw new InsightError("Options must include columns key");
        }
        if (options[CheckQuery.OPTIONSKeys[0]].length === 0) {
            throw new InsightError("Options must not have 0 length");
        }
        Object.keys(options).forEach((key: string) => {
            if (!CheckQuery.OPTIONSKeys.includes(key)) {
                throw new InsightError("OPTIONS must only have columns and order keys");
            }
        });
        this.validOptionsColumns(options);
        // ORDER
        if (Object.keys(options).includes(CheckQuery.OPTIONSKeys[1])) {
            if (options["ORDER"] === null) {
                throw new InsightError("ORDER can't be null");
            }
            if (typeof options["ORDER"] === "string") {
                let order = options["ORDER"];
                if (!options["COLUMNS"].includes(order)) {
                        throw new InsightError("ORDER must be in COLUMNS");
                }
            } else {
                // insert check for keys in array
                if (Object.keys(options["ORDER"]).length !== 2) {
                    throw new InsightError("ORDER must have two keys");
                }
                if (Object.keys(options["ORDER"])[0] !== CheckQuery.SORTORDER[0] ||
                    Object.keys(options["ORDER"])[1] !== CheckQuery.SORTORDER[1]) {
                    throw new InsightError("ORDER must have a dir key");
                }
                let orderDir = options["ORDER"][CheckQuery.SORTORDER[0]];
                if (!CheckQuery.DIRECTION.includes(orderDir)) {
                    throw new InsightError("DIRECTION must be valid");
                }
                let orderKey = options["ORDER"][CheckQuery.SORTORDER[1]];
                if (orderKey.length === 0) {
                    throw new InsightError("keys cannot be empty");
                }
                orderKey.forEach((key: string) => {
                    if (!options["COLUMNS"].includes(key)) {
                        throw new InsightError("COLUMNS must include ORDER key");
                    }
                });
            }
        }
    }

    private validOptionsColumns(options: any) {
        options["COLUMNS"].forEach((key: string) => {
            let strings = key.split("_");
            if (strings.length >= 3) {
                throw new InsightError("too many underscores");
            }
            if (this.transform) {
                let inTransform: boolean = false;
                this.pquery["TRANSFORMATIONS"]["APPLY"].forEach((rule: any) => {
                    inTransform = inTransform || Object.keys(rule).includes(key);
                });
                inTransform = inTransform || this.pquery["TRANSFORMATIONS"]["GROUP"].includes(key);
                if (!inTransform) {
                    throw new InsightError
                    ("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
                }
            } else {
                this.checkStringField(strings[1]);
            }
        });
    }


    private checkValidTransformations(pquery: any) {
        if (!Object.keys(pquery["TRANSFORMATIONS"]).includes("GROUP")) {
            throw new InsightError("Must include nonempty GROUP");
        }
        if (pquery["TRANSFORMATIONS"]["GROUP"].length === 0) {
            throw new InsightError("Must include nonempty GROUP");
        }

        Object.keys(pquery["TRANSFORMATIONS"]).forEach((key: string) => {
            if (!(["GROUP", "APPLY"]).includes(key)) {
                throw new InsightError("TRANSFORMATIONS must only include GROUP/APPLY");
            }
        });
        this.checkValidGroup(pquery["TRANSFORMATIONS"]["GROUP"]);
        this.checkValidApply(pquery["TRANSFORMATIONS"]["APPLY"]);
    }

    private checkValidApply(pquery: any[]) {
        let applyKeys: string[] = new Array();
        pquery.forEach((rule: any) => {
            if (Object.keys(rule)[0] === "") {
                throw new InsightError("Apply key cannot be empty string");
            }
            if (!CheckQuery.APPLYTOKEN.includes(Object.keys(rule[Object.keys(rule)[0]])[0])) {
                throw new InsightError("Must have valid APPLYTOKEN");
            }

            let field = rule[Object.keys(rule)[0]][Object.keys(rule[Object.keys(rule)[0]])[0]].split("_")[1];
            let name = rule[Object.keys(rule)[0]][Object.keys(rule[Object.keys(rule)[0]])[0]].split("_")[0];
            let applyToken = Object.keys(rule[Object.keys(rule)[0]])[0];
            if (name !== this.id) {
                throw new InsightError("Should only have one dataset");
            }
            if (applyToken === CheckQuery.APPLYTOKEN[3]) {
                this.checkStringField(field);
            } else {
                this.checkMFields(field);
            }

            if (Object.keys(rule).length !== 1 || Object.keys(rule[Object.keys(rule)[0]]).length !== 1) {
                throw new InsightError("Must have one apply key and token in one rule");
            }

            if (Object.keys(rule)[0].includes("_")) {
                throw new InsightError("Cannot have underscore in applyKey");
            }

            if (applyKeys.includes(Object.keys(rule)[0])) {
                throw new InsightError("Duplicate APPLY key " + Object.keys(rule)[0]);
            }

            applyKeys.push(Object.keys(rule)[0]);
        });

    }

    private checkValidGroup(pquery: any[]) {
        pquery.forEach((key: string) => {
            if (key.split("_").length >= 3) {
                throw new InsightError("Too many underscores");
            }
            if (key.split("_")[0] !== this.id) {
                throw new InsightError("Should only have one dataset");
            }
            this.checkStringField(key.split("_")[1]);

        });
    }
}
