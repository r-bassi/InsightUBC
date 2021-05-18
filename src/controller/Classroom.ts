import {Dataset} from "./Dataset";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import {CourseSection} from "./CourseSection";
import * as JSZip from "jszip";
import {Building} from "./Building";
const parse5 = require("parse5");

export class Classroom {
    public fullname: string;
    public shortname: string;
    public number: string;
    public name: string;
    public address: string;
    public lat: number;
    public lon: number;
    public seats: number;
    public type: string;
    public furniture: string;
    public href: string;

    constructor(building: Building, classNumber: string, seats: number,
                type: string, furniture: string, href: string) {
        this.fullname = building.longName;
        this.shortname = building.shortName;
        this.number = classNumber;
        this.name = this.shortname + "_" + this.number;
        this.address = building.address;
        this.lat = building.lat;
        this.lon = building.lon;
        this.seats = seats;
        this.type = type;
        this.furniture = furniture;
        this.href = href;
    }

}

export class ClassroomFactory {
    private static checkClassroom(roomNumber: string, seats: number,
                                  type: string, furniture: string, href: string): boolean {
        if (roomNumber !== undefined && seats !== undefined &&
            type !== undefined && furniture !== undefined && href !== undefined) {
            return true;
        }
        return false;
    }

    private static getRoomNumber(elem: any): string {
        let roomNumber: string = "";
        if (elem.childNodes && elem.childNodes.length > 0) {
            for (let child2 of elem.childNodes) {
                if (child2.nodeName === "a") {
                    if (child2.childNodes && child2.childNodes.length > 0) {
                        roomNumber = child2.childNodes[0].value.trim();
                    }
                }
            }
        }
        return roomNumber;
    }

    private static getSeats(elem: any): number {
        let seats: number = 0;
        if (elem.childNodes && elem.childNodes.length > 0) {
            seats = parseInt(elem.childNodes[0].value, 10);
        }
        return seats;
    }

    private static getFurniture(elem: any): string {
        let furniture: string = "";
        if (elem.childNodes && elem.childNodes.length > 0) {
            furniture = elem.childNodes[0].value.trim();
        }
        return furniture;
    }

    private static getType(elem: any): string {
        let type: string = "";
        if (elem.childNodes && elem.childNodes.length > 0) {
            type = elem.childNodes[0].value.trim();
        }
        return type;
    }

    private static getHref(elem: any): string {
        let href: string = "";
        if (elem.attrs[0].value.trim()
            .startsWith("http://students.ubc.ca/")
        ) {
            href = elem.attrs[0].value.trim();
        }
        return href;
    }

    public static parseClassroom (elem: any, building: Building) {
        if (elem.childNodes && elem.childNodes.length > 0) {
            let roomNumber: string;
            let seats: number;
            let type: string;
            let furniture: string;
            let href: string;
            for (let child of elem.childNodes) {
                if (child.nodeName === "td") {
                    if (child.attrs[0].value.split("-").pop() === "number") {
                        roomNumber = this.getRoomNumber(child);
                    }
                    if (child.attrs[0].value.split("-").pop() === "capacity") {
                        seats = this.getSeats(child);
                    }
                    if (child.attrs[0].value.split("-").pop() === "furniture") {
                        furniture = this.getFurniture(child);
                    }
                    if (child.attrs[0].value.split("-").pop() === "type") {
                        type = this.getType(child);
                    }
                    if ((child.attrs[0].value.split("-").pop() === "nothing" ||
                        child.attrs[0].value.split("-").pop() === "number") &&
                        href === undefined
                    ) {
                        if (child.childNodes && child.childNodes.length > 0) {
                            for (let child2 of child.childNodes) {
                                if (child2.nodeName === "a" &&
                                    child2.attrs[0].name === "href"
                                ) {
                                    href = this.getHref(child2);
                                }
                            }
                        }
                    }
                }
            }
            if (this.checkClassroom(roomNumber, seats, type, furniture, href)) {
                return new Classroom(building, roomNumber, seats, type, furniture, href);
            }
        }
        return -1;
    }
}
