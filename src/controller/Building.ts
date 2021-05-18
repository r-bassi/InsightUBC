import * as http from "http";
import {InsightError} from "./IInsightFacade";

export class Building {
    public address: string;
    public shortName: string;
    public longName: string;
    public lat: number;
    public lon: number;


    constructor(address: string, shortName: string, longName: string, lat: number, lon: number) {
        this.address = address;
        this.shortName = shortName;
        this.longName = longName;
        this.lat = lat;
        this.lon = lon;
    }

}

export class GeoResponse {
    public lat: number;
    public lon: number;
    constructor(lat: number, lon: number) {
        this.lat = lat;
        this.lon = lon;
    }
}

export function findGeolocation(address: string): Promise<GeoResponse> {
    let geoResponse: GeoResponse;
    let url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team213/<ADDRESS>";
    let uriComponent = encodeURIComponent(address);
    url = url.replace("<ADDRESS>", uriComponent);
    return new Promise((resolve, reject) => {
        http.get(url, (response) => {
            response.setEncoding("utf8");
            let Data = "";
            response.on("data", (Listener) => {
                Data += Listener;
            });
            response.on("end", () => {
                if (Object.keys(JSON.parse(Data)).includes("error")) {
                    reject(JSON.parse(Data));
                } else {
                    geoResponse = JSON.parse(Data);
                    resolve(geoResponse);
                }
            });
        }).on("error", (Error) => {
            reject(`Error: ${Error.message}`);
        });
    });
}

export class BuildingFactory {
    private static queryGeography(address: string): GeoResponse {
        return undefined;
    }


    public static getBuildinginfo (elem: any, buildingShortName: string): any {
        if (elem.nodeName === "div" &&
            elem.attrs[0].name === "id" &&
            elem.attrs[0].value === "building-info") {
            let bld = this.parseBuilding(elem, buildingShortName);
            return bld;
        }
        if (elem.childNodes && elem.childNodes.length > 0) {
            for (let child of elem.childNodes) {
                let possibleBuilding = this.getBuildinginfo(child, buildingShortName);
                if (possibleBuilding !== -1 ) {
                    return possibleBuilding;
                }
            }
        }
        return -1;
    }

    private static parseBuilding (building: any, buildingShortName: string): any {
        if (this.isValidBuilding(building)) {
            let longName = building.childNodes[1].childNodes[0].childNodes[0].value;
            let address = building.childNodes[3].childNodes[0].childNodes[0].value;
            let bld = new Building(address, buildingShortName, longName, 0, 0);
            return bld;
            /*return findGeolocation(address)
                .then((response) => {
                    bld.lat = response.lat;
                    bld.lon = response.lon;
                    bld.address = address;
                    bld.shortName = buildingShortName;
                    bld.longName = longName;
                    return bld;
                }).catch((error) => {
                    throw new InsightError("Geolocation error");
                });
                */
        }
        return -1;
    }

    private static isValidBuilding (building: any): boolean {
        if (building.childNodes
            && building.childNodes.length > 4 &&
            building.childNodes[1].childNodes &&
            building.childNodes[1].childNodes.length > 0 &&
            building.childNodes[1].childNodes[0].childNodes &&
            building.childNodes[1].childNodes[0].childNodes.length > 0 &&
            building.childNodes[3].childNodes &&
            building.childNodes[3].childNodes.length > 0 &&
            building.childNodes[3].childNodes[0].childNodes &&
            building.childNodes[3].childNodes[0].childNodes.length > 0) {
            return true;
        } else {
            return false;
        }
    }
}
