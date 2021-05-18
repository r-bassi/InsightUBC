import {InsightError} from "./IInsightFacade";
import {type} from "os";
import {CheckQuery} from "./CheckQuery";

export class CheckQueryRooms extends CheckQuery {
    private static RoomsMFields = ["lat", "lon", "seats"];
    private static RoomsSFields = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];

    public checkMFields(str: string): any {
        if (!CheckQueryRooms.RoomsMFields.includes(str)) {
            throw new InsightError("Invalid MField " + str);
        }
    }

    public checkSFields(str: string): any {
        if (!CheckQueryRooms.RoomsSFields.includes(str)) {
            throw new InsightError("Invalid SField " + str);
        }
    }

    public checkStringField(str: string): any {
        if (!CheckQueryRooms.RoomsMFields.includes(str)) {
            if (!CheckQueryRooms.RoomsSFields.includes(str)) {
                throw new InsightError("invalid string " + str);
            }
        }
    }

    public checkAllKeys(str: string): boolean {
        if (!CheckQueryRooms.RoomsMFields.includes(str)) {
            if (!CheckQueryRooms.RoomsSFields.includes(str)) {
                return false;
            }
        }
        return true;
    }
}
