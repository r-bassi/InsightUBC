import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";

export abstract class Dataset {
    public abstract parseDataset(content: string): Promise<any[]>;
    public abstract parseElem(content: string): any[];
    public abstract insightDataset(): InsightDataset;
    public id: string;
    public kind: InsightDatasetKind;
    public attributes: any[];
    constructor (id: string, kind: InsightDatasetKind) {
        this.id = id;
        this.kind = kind;
    }

    public getAttributes(): any[] {
        return this.attributes;
    }

    public setAttributes(attributes: any[]) {
        this.attributes = attributes;
    }

    public readAndParse(file: any) {
        return file.async("string")
            .then((elem: any) => {
                return this.parseElem(elem);
            });
    }


    public elemConCat(result: any[][], elem: any[]): any[] {
        result.forEach((c: any[]) => {
            elem = elem.concat(c);
        });
        return (elem);
    }
}
