export class CourseSection {
    public dept: string;
    public id: string;
    public avg: number;
    public instructor: string;
    public title: string;
    public pass: number;
    public fail: number;
    public audit: number;
    public uuid: string;
    public year: number;

    constructor(
        dept: string, id: string, avg: number, instructor: string,
        title: string, pass: number, fail: number, audit: number, uuid: string, year: number) {
        this.dept = dept;
        this.id = id;
        this.avg = avg;
        this.instructor = instructor;
        this.title = title;
        this.pass = pass;
        this.fail = fail;
        this.audit = audit;
        this.uuid = uuid;
        this.year = year;
    }
}

export class CourseSectionFactory {
    public static create(section: any): CourseSection {
        let yearParameter: number;
        if (section["Section"] === "overall") {
            yearParameter = 1900;
        } else if (section["Year"] !== undefined && typeof section["Year"] === "string") {
            if (!isNaN(parseInt(section["Year"], 10))) {
                yearParameter = parseInt(section["Year"], 10);
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }

        if (section["Subject"] !== undefined && typeof section["Subject"] === "string" &&
            section["Course"] !== undefined && typeof section["Course"] === "string" &&
            section["Avg"] !== undefined && typeof section["Avg"] === "number" &&
            section["Professor"] !== undefined && typeof section["Professor"] === "string" &&
            section["Title"] !== undefined && typeof section["Title"] === "string" &&
            section["Pass"] !== undefined && typeof section["Pass"] === "number" &&
            section["Fail"] !== undefined && typeof section["Fail"] === "number" &&
            section["Audit"] !== undefined && typeof section["Audit"] === "number" &&
            section["id"] !== undefined && typeof section["id"] === "number") {
            return new CourseSection(
                section["Subject"], section["Course"], section["Avg"],
                section["Professor"], section["Title"], section["Pass"],
                section["Fail"], section["Audit"], section["id"].toString(),
                yearParameter);
        }
        return undefined;
    }
}
