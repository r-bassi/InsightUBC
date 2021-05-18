import {Dataset} from "./Dataset";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {CourseSection, CourseSectionFactory} from "./CourseSection";

export class Course extends Dataset {

    public insightDataset(): InsightDataset {
        return {
            id: this.id,
            kind: InsightDatasetKind.Courses,
            numRows: this.attributes.length};
    }

    public parseElem(content: string): any[] {
        let obj: any;
        const array: CourseSection[] = [];
        try {
            obj = JSON.parse(content);
        } catch (e) {
            // pass
            return array;
        }
        for (const section of obj["result"]) {
            let current: CourseSection = CourseSectionFactory.create(section);

            if (current !== undefined) {
                array.push(current);
            }
        }
        return array;
    }


    public parseDataset(content: string): Promise<CourseSection[]> {
        let subdirectory: RegExp = /^courses\/.*/;

        return new Promise<CourseSection[]>((resolve, reject) => {
            JSZip.loadAsync(content, {base64: true})
                .then((zobj) => {
                    let wait: Array<Promise<CourseSection[]>> = new Array();
                    let sections: CourseSection[] = new Array();

                    if (zobj.folder(subdirectory).length === 0) {
                        reject(new InsightError("subdirectory \"courses\" does not exist"));
                        return;
                    }
                    zobj.file(subdirectory)
                        .forEach((file, _) => {
                            if (!file.dir) {
                                wait.push(
                                    this.readAndParse(file)
                                );
                            }
                        });
                    Promise.all(wait)
                        .then((result) => {
                            resolve(this.elemConCat(result, sections));
                        });
                })
                .catch((err) => {
                    reject(new InsightError(err));
                    return;
                });
        });
    }
}
