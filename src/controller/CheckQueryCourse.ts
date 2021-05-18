import {InsightError} from "./IInsightFacade";
import {type} from "os";
import {CheckQuery} from "./CheckQuery";

export class CheckQueryCourse extends CheckQuery {
    private static CourseMFields = ["avg", "pass", "fail", "audit", "year"];
    private static CourseSFields = ["dept", "id", "instructor", "title", "uuid"];

    public checkMFields(str: string): any {
        if (!CheckQueryCourse.CourseMFields.includes(str)) {
            throw new InsightError("Invalid MField " + str);
        }
    }

    public checkSFields(str: string): any {
        if (!CheckQueryCourse.CourseSFields.includes(str)) {
            throw new InsightError("Invalid SField " + str);
        }
    }

    public checkStringField(str: string): any {
        if (!CheckQueryCourse.CourseMFields.includes(str)) {
            if (!CheckQueryCourse.CourseSFields.includes(str)) {
                throw new InsightError("invalid string "  + str);
            }
        }
    }

    public checkAllKeys(str: string): boolean {
        if (!CheckQueryCourse.CourseMFields.includes(str)) {
            if (!CheckQueryCourse.CourseSFields.includes(str)) {
                return false;
            }
        }
        return true;
    }
}


