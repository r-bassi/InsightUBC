import {Dataset} from "./Dataset";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import {Classroom, ClassroomFactory} from "./Classroom";
import {CourseSection} from "./CourseSection";
import * as JSZip from "jszip";
import {Building, findGeolocation, BuildingFactory} from "./Building";
import * as parse5 from "parse5";
export class Room extends Dataset {
    public insightDataset(): InsightDataset {
        return {
            id: this.id,
            kind: InsightDatasetKind.Rooms,
            numRows: this.attributes.length};
    }

    public parseElem(content: string): any[] {
        let obj: any;
        const array: Classroom[] = [];

        return array;
    }

    private getHTML(html: string): Promise<any> {
        return Promise.resolve(parse5.parse(html));
    }

    private findClassRooms(element: any): any {
        let returnArray: string[] = new Array();
        if (element.nodeName === "a" &&
            element.attrs[0].value.startsWith("./campus/discover/buildings-and-classrooms/") &&
            element.childNodes.length > 0 &&
            element.childNodes[0].value === "More info") {
            returnArray.push(element.attrs[0].value);
            return returnArray;
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                let possibleClassrooms = this.findClassRooms(child);
                if (possibleClassrooms.length !== 0 ) {
                    returnArray = returnArray.concat(possibleClassrooms);
                }
            }
        }
        return returnArray;
    }

    private getClassroom(html: any, building: Building) {
        return new Promise((resolve, reject) => {
            findGeolocation(building.address)
                .then((response) => {
                    building.lat = response.lat;
                    building.lon = response.lon;
                    let returnedclassrooms = this.getClassroomsinfo(html, building);
                    resolve(returnedclassrooms);
                }).catch((error) => {
                resolve([]);
            });
        });
    }

    private getClassRooms(classroompaths: any, zobj: any, shortnames: string[]): any {
        return new Promise((resolve, reject) => {
            let wait = new Array();
            let classrooms = new Array();
            for (let path of classroompaths) {
                let newpath = "rooms".concat(path.substring(1));
                if (zobj.file(newpath) === null) {
                    continue;
                }
                wait.push(
                    zobj.file(newpath).async("string")
                        .then((elem: any) => {
                            return this.getHTML(elem);
                        })
                        .catch((err: any) => {
                            return "";  // skip over rooms that does not exist
                        })
                );
            }
            let promiseArray = new Array();
            Promise.all(wait)
                .then((results) => {
                    let ind = 0;
                    results.forEach((result) => {
                        let buildingInfo = BuildingFactory.getBuildinginfo(result, shortnames[ind]);
                        promiseArray.push(this.getClassroom(result, buildingInfo));
                        ind = ind + 1;
                    });
                    Promise.all(promiseArray)
                        .then((classrms) => {
                            resolve(this.appendClassrooms(classrms));
                        })
                        .catch((err2) => {
                            reject(new InsightError(err2));
                        });
                })
                .catch((err) => {
                    reject(new InsightError(err));
                });
        });
    }

    private appendClassrooms(classrooms: Classroom[][]): Classroom[] {
        let appendedclassrooms = new Array();
        classrooms.forEach((classroom) => {
            appendedclassrooms = appendedclassrooms.concat(classroom);
        });
        return appendedclassrooms;
    }

    private parseClassrooms (elem: any, building: Building) {
        let classrooms = new Array();
        if (elem.childNodes && elem.childNodes.length > 0) {
            for (let child of elem.childNodes) {
                if (child.nodeName === "tr") {
                    let classroom = ClassroomFactory.parseClassroom(child, building);
                    if (classroom !== -1) {
                        classrooms.push(classroom);
                    }
                }
            }
        }
        return classrooms;
    }

    private getClassroomsinfo (elem: any, building: Building): any {
        if (elem.nodeName === "table" &&
            elem.childNodes &&
            elem.childNodes.length > 0) {
            for (let child of elem.childNodes) {
                if (child.nodeName === "tbody") {
                    return this.parseClassrooms(child, building);
                }
            }
        }
        if (elem.childNodes &&
            elem.childNodes.length > 0) {
            for (let child of elem.childNodes) {
                let possibleClassrooms = this.getClassroomsinfo(child, building);
                if (possibleClassrooms.length !== 0) {
                    return possibleClassrooms;
                }
            }
        }
        return [];
    }


    private getShortNames(elem: any): any {
        let shortNames: string[] = new Array();
        if (elem.nodeName === "td" &&
            elem.attrs[0].value === "views-field views-field-field-building-code" &&
            elem.childNodes &&
            elem.childNodes.length > 0
        ) {
            let shortName: string = elem.childNodes[0].value.trim();
            shortNames.push(shortName);
            return shortNames;
        }
        if (elem.childNodes && elem.childNodes.length > 0) {
            for (let child of elem.childNodes) {
                let returnedShortNames = this.getShortNames(child);
                if (returnedShortNames.length > 0) {
                    shortNames = shortNames.concat(returnedShortNames);
                }
            }
        }
        return shortNames;
    }

    public parseDataset(content: string): Promise<Classroom[]> {
        let subdirectory: RegExp = /^rooms\/.*/;
        return new Promise<Classroom[]>((resolve, reject) => {
            JSZip.loadAsync(content, {base64: true})
                .then((zobj) => {
                    let rooms = new Array();

                    if (zobj.folder(subdirectory).length === 0) {
                        reject(new InsightError("subdirectory \"rooms\" does not exist"));
                        return;
                    }
                    let path: string = "rooms/index.htm";
                    let readFile = new Promise ((resolve2, reject2) => {
                        zobj.file(path).async("string")
                            .then((elem: any) => {
                                return resolve2(this.getHTML(elem));
                            })
                            .catch((err) => {
                                return reject2(new InsightError(err));
                            });
                    });
                    readFile.then((result) => {
                        let shortNames: string[] = this.getShortNames(result);
                        let classroomPaths: string[] = this.findClassRooms(result);
                        // TODO: DO NOT fail when one of the classrooms fail but not the others
                        this.getClassRooms(classroomPaths, zobj, shortNames)
                            .then((classrooms: any) => {
                                return resolve(classrooms);
                            })
                            .catch((err: any) => {
                            return reject (new InsightError(err));
                        });
                    })
                        .catch((err) => {
                            return reject(new InsightError(err));
                        });
                })
                .catch((err) => {
                    reject(new InsightError(err));
                    return;
                });
        });
    }
}
