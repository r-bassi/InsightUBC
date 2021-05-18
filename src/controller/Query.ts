import {InsightError, ResultTooLargeError} from "./IInsightFacade";
import {CheckQuery} from "./CheckQuery";
import {Dataset} from "./Dataset";
import {CourseSection} from "./CourseSection";
import {Order} from "./Order";
import {Transformations} from "./Transformations";
import {CheckQueryCourse} from "./CheckQueryCourse";
import {CheckQueryRooms} from "./CheckQueryRooms";
import {Course} from "./Course";
import {Room} from "./Room";

export class Query {

    private performQueryHelper(where: any, id: string, datasets: Map<string, Dataset>,
                               pquery: any, transform: boolean) {
        let filterResult: any[] = new Array();

        if (Object.keys(pquery["WHERE"]).length === 0) {
            filterResult = datasets.get(id).getAttributes();
        } else if (Object.keys(pquery["WHERE"]).length !== 1) {
            throw new InsightError("WHERE must have a single key");
        } else {
            filterResult = datasets.get(id).getAttributes().filter((section: any) => {
                return this.parseOutput(where, section);
            });
        }

        if (transform && "TRANSFORMATIONS" in pquery) {
            let transformation = new Transformations(
                pquery["TRANSFORMATIONS"]["GROUP"],
                pquery["TRANSFORMATIONS"]["APPLY"]);
            transformation.aggregate(filterResult);
            filterResult = transformation.applyRules();
        }

        if (filterResult.length > 5000) {
            return Promise.reject(new ResultTooLargeError("result too large error"));
        }

        let returnValue: any[] = this.renameColumns(pquery, filterResult);

        if (pquery["OPTIONS"] !== undefined && pquery["OPTIONS"]["ORDER"] !== undefined) {
            let orderObj: Order;
            if (typeof pquery["OPTIONS"]["ORDER"] === "string") {
                orderObj = new Order("up", [pquery["OPTIONS"]["ORDER"]]);
            } else {
                orderObj = new Order(pquery["OPTIONS"]["ORDER"]["dir"], pquery["OPTIONS"]["ORDER"]["keys"]);
            }
            returnValue.sort((l: {[key: string]: (number | string)}, r: {[key: string]: (number | string)}) => {
                return orderObj.compare(l, r);
            });
        }
        return Promise.resolve(returnValue);
    }

    public performQuery(datasets: Map<string, Course>, rooms: Map<string, Room>, pquery: any): Promise<any[]> {
        try {
            let where = pquery["WHERE"];
            let id = this.checkID(datasets, rooms, pquery);
            let queryType = this.queryType(datasets, rooms, id);
            if (queryType === "courses") {
                let checkQuery = new CheckQueryCourse(pquery, id);
                checkQuery.validPQ();
                return this.performQueryHelper(where, id, datasets, pquery, checkQuery.transform);
            } else {
                let checkQuery = new CheckQueryRooms(pquery, id);
                checkQuery.validPQ();
                return this.performQueryHelper(where, id, rooms, pquery, checkQuery.transform);
            }
        } catch (err) {
            return Promise.reject(new InsightError(err));
        }
    }

    private renameColumns(query: any, records: any[]) {
        let result: any[] = new Array();
        records.forEach((record: {[key: string]: any}) => {
            let s: {[key: string]: any} = {};
            query["OPTIONS"]["COLUMNS"]
                .forEach((key: string) => {
                    if (key.split("_").length === 2) {
                        s[key] = record[key.split("_")[1]];
                    } else {
                        s[key] = record[key];
                    }
                });
            result.push(s);
        });
        return result;
    }

    // TODO: Properly check id to see if there is only one
    private checkID(courses: Map<string, Course>, rooms: Map<string, Room>,
                    pquery: any): string {
        let workingSet = new Set<string>();
        pquery["OPTIONS"]["COLUMNS"].forEach((idKeyPair: string) => {
            if (idKeyPair.includes("_")) {
                if (courses.has(idKeyPair.split("_")[0])) {
                    workingSet.add(idKeyPair.split("_")[0]);
                } else if (rooms.has(idKeyPair.split("_")[0])) {
                    workingSet.add(idKeyPair.split("_")[0]);
                }
            }
        });
        if ("TRANSFORMATIONS" in pquery) {
            pquery["TRANSFORMATIONS"]["GROUP"].forEach((idKeyPair: string) => {
                if (idKeyPair.includes("_")) {
                    if (courses.has(idKeyPair.split("_")[0])) {
                        workingSet.add(idKeyPair.split("_")[0]);
                    } else if (rooms.has(idKeyPair.split("_")[0])) {
                        workingSet.add(idKeyPair.split("_")[0]);
                    }
                }
            });
        }
        if (workingSet.size !== 1) {
            throw new InsightError("Must use only one dataset");
        }
        return Array.from(workingSet)[0];
    }

    private queryType(courses: Map<string, Course>, rooms: Map<string, Room>, id: string): string {
        if (courses.has(id)) {
            return "courses";
        } else {
            return "rooms";
        }
    }

    private parseOutput(where: object, section: object): boolean {
        let key = Object.keys(where)[0];
        switch (key) {
            case "AND":
                return this.and(where, section);
            case "OR":
                return this.or(where, section);
            case "NOT":
                return this.not(where, section);
            case "LT":
                return this.mcompare(where, section);
            case "GT":
                return this.mcompare(where, section);
            case "EQ":
                return this.mcompare(where, section);
            case "IS":
                return this.scompareParse(where, section);
            default:
                throw new InsightError("Invalid key");
        }
    }


    private and(a: any, section: any): boolean {
        let inner: any = Object.values(a)[0];
        for (const property in inner) {
            if (!this.parseOutput(inner[property], section)) {
                return false;
            }
        }
        return true;
    }

    private or(o: any, section: any): boolean {
        let inner: any = Object.values(o)[0];
        for (const property in inner) {
            if (this.parseOutput(inner[property], section)) {
                return true;
            }
        }
        return false;
    }

    private not(n: any, section: any): boolean {
        return !(this.parseOutput(n["NOT"], section));
    }

    private mcompare(where: any, section: any): boolean {
        let operator: string = Object.keys(where)[0];
        let threshold: number = Number(Object.values(where[operator])[0]);
        let cField: string = Object.keys(where[operator])[0].split("_")[1];
        let sectionValue: number = section[cField];
        switch (operator) {
            case "EQ":
                return sectionValue === threshold;
            case "GT":
                return sectionValue > threshold;
            case "LT":
                return sectionValue < threshold;
            default:
                throw new InsightError(`no such mkey ${operator}`);
        }
    }

    private scompareParse(where: any, section: any) {
        let queryValue: any = Object.values(where["IS"])[0];
        let sectionKey: any = Object.keys(where["IS"])[0]
            .split("_")[1];
        let sectionValue: string = String(section[sectionKey]);
        if (sectionValue === undefined) {
            return false;
        }

        if (queryValue === "*" || queryValue === "**") {
            return true;
        }

        let astrixCount = queryValue.split("*").length - 1;
        if (astrixCount === 1) {
            if (queryValue[0] !== "*" && queryValue.slice(-1) !== "*") {
                throw new InsightError("* must be at the start or the end");
            }
        } else if (astrixCount === 2) {
            if (queryValue[0] !== "*" || queryValue.slice(-1) !== "*") {
                throw new InsightError("* must be at the start or the end");
            }
        } else if (astrixCount > 2) {
            throw new InsightError("maximum two * allowed");
        }

        return RegExp("^" + queryValue.replace(/[*]/g, ".*") + "$").test(sectionValue);
    }

}
