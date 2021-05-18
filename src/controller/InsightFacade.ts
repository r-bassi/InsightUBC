import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as fs from "fs";
import {Query} from "./Query";
import {Course} from "./Course";
import {Dataset} from "./Dataset";
import {Classroom} from "./Classroom";
import {Room} from "./Room";
import {CourseSection} from "./CourseSection";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    public static invalidType: string = "invalid dataset type";
    public static invalidIdUnderscore: string = "id contains underscore";
    public static invalidDatasetExists: string = "id already exists within ./data";
    public static invalidDoesNotExist: string = "id to be removed does not exist ./data";

    public courses: Map<string, Course>;
    public rooms: Map<string, Room>;

    constructor() {
        this.courses = new Map<string, Course>();
        this.rooms = new Map<string, Room>();
        const dicts = fs.readdirSync("./data");
        dicts.forEach((dict) => {
            if (dict === "courses") {
                const files = fs.readdirSync("./data/courses");
                files.forEach((file) => {
                    let content = fs.readFileSync("./data/courses/".concat(file), "utf8");
                    let dataset = new Course(file, InsightDatasetKind.Courses);
                    dataset.setAttributes(JSON.parse(content));
                    this.courses.set(file, dataset);
                });
            } else if (dict === "rooms") {
                const files = fs.readdirSync("./data/rooms");
                files.forEach((file) => {
                    let content = fs.readFileSync("./data/rooms/".concat(file), "utf8");
                    let dataset = new Room(file, InsightDatasetKind.Rooms);
                    dataset.setAttributes(JSON.parse(content));
                    this.rooms.set(file, dataset);
                });
            }
        });
    }

    private cached(id: string): boolean {
        return (this.courses.has(id) || this.rooms.has(id));
    }

    private isValid(id: string): boolean {
        const underscore: string = "_";
        const whitespace: RegExp = /^[ ]*$/;
        if (id == null) {
            throw new InsightError("id is null");
        }
        // check if id contains underscore
        if (id.indexOf(underscore) !== -1) {
            throw new InsightError(InsightFacade.invalidIdUnderscore);
        }
        // check if id contains only white spaces
        if (whitespace.test(id)) {
            throw new InsightError("id contains only white spaces");
        }
        return true;
    }

    private getIDS(): string[] {
        return Array.from(this.courses.keys())
            .concat(Array.from(this.rooms.keys()));
    }

    private roomSetup (rooms: Room, classrooms: Classroom[], id: string) {
        rooms.setAttributes(classrooms);
        this.rooms.set(id, rooms);
        if (!fs.existsSync(`./data/rooms`)) {
            fs.mkdirSync(`./data/rooms`);
        }
        return rooms;
    }

    private courseSetup(course: Course, sections: CourseSection[], id: string) {
        course.setAttributes(sections);
        this.courses.set(id, course);
        if (!fs.existsSync(`./data/courses`)) {
            fs.mkdirSync(`./data/courses`);
        }
        return course;
    }

    private addCourse(id: string, content: string, kind: InsightDatasetKind, resolve: any, reject: any) {
        let course: Course = new Course(id, kind);
        course.parseDataset(content)
            .then((sections) => {
                if (sections.length === 0) {
                    reject(new InsightError("dataset must contain at least one valid course section"));
                    return;
                }
                course = this.courseSetup(course, sections, id);
                fs.writeFile(`./data/courses/${id}`, JSON.stringify(sections), () => {
                    return resolve(this.getIDS());
                });
            })
            .catch((err) => {
                reject(err);
                return;
            });
    }

    private addRoom(id: string, content: string, kind: InsightDatasetKind, resolve: any, reject: any) {
        let rooms: Room = new Room(id, kind);
        rooms.parseDataset(content)
            .then((classrooms) => {
                if (classrooms.length === 0) {
                    reject(new InsightError("dataset must contain at least one valid course section"));
                    return;
                }
                rooms = this.roomSetup(rooms, classrooms, id);
                fs.writeFile(`./data/rooms/${id}`, JSON.stringify(classrooms), () => {
                    return resolve(this.getIDS());
                });
            })
            .catch((err) => {
                reject(err);
                return;
            });

    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            try {
                if (this.isValid(id)) {
                    if (this.cached(id)) {
                        reject(new InsightError(InsightFacade.invalidDatasetExists));
                        return;
                    }
                    if (kind === InsightDatasetKind.Courses) {
                        return this.addCourse(id, content, kind, resolve, reject);
                    } else if (kind === InsightDatasetKind.Rooms) {
                        return this.addRoom(id, content, kind, resolve, reject);
                    } else {
                        reject(new InsightError(InsightFacade.invalidType));
                    }
                }
            } catch (e) {
                reject(e);
                return;
            }
        });
    }

    public removeDataset(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            try {
                this.isValid(id);
                if (!this.cached(id)) {
                    return reject(new NotFoundError(InsightFacade.invalidDoesNotExist));
                }
                if (this.courses.has(id)) {
                    this.courses.delete(id);
                    fs.unlinkSync(`./data/courses/${id}`);
                }
                if (this.rooms.has(id)) {
                    this.rooms.delete(id);
                    fs.unlinkSync(`./data/rooms/${id}`);
                }
                return resolve(id);
            } catch (err) {
                return reject(err);
            }
        });
    }

    public performQuery(query: any): Promise<any[]> {
        try {
            let pquery = new Query();
            return Promise.resolve(pquery.performQuery(this.courses, this.rooms, query));
        } catch (err2) {
            return Promise.reject(new InsightError(err2));
        }
    }


    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise<InsightDataset[]>((resolve, reject) => {
            let insightDatasets: InsightDataset[] = new Array();
            this.rooms.forEach((room, key) => {
                insightDatasets.push(room.insightDataset());
            });
            this.courses.forEach((course, key) => {
                insightDatasets.push(course.insightDataset());
            });
            resolve(insightDatasets);
        });
    }

}
