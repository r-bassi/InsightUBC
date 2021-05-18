import {ApplyRule, AverageRule, CountRule, MaxRule, MinRule, SumRule} from "./ApplyRule";

export class Transformations {
    private group: string[];
    private rules: ApplyRule[];

    private subset: Map<string, Subset>;

    constructor(group: string[], apply: any[]) {
        this.group = new Array();
        group.forEach((element) => {
            const s = element.split("_");
            this.group.push(s[1]);
        });

        this.rules = new Array();
        apply.forEach((element) => {
            const rule = this.createRule(element);
            this.rules = this.rules.concat(rule);
        });

        this.subset = new Map<string, Subset>();
    }

    public aggregate(unAggregated: any[]) {
        unAggregated.forEach((element) => {
            const index: string = this.aggregationIndex(element);

            if (!this.subset.has(index)) {
                const subsetKey = this.aggregationKey(element);
                this.subset.set(index, new Subset(subsetKey));
            }
            this.subset.get(index).append(element);
        });
    }

    public applyRules(): any[] {
        let result: any[] = new Array();

        // for each subset, apply all the rules!
        for (const element of this.subset.values()) {
            const r = element.applyRules(this.rules);
            result = result.concat(r);
        }

        return result;
    }

    // feature envy: this belongs in ClassRoom or ClassSection
    // if group is empty, all records will return the same index
    private aggregationIndex(record: any): string {
        let result: string = "";
        this.group.forEach((element) => {
            result = result.concat(record[element], ", ");
        });
        return result;
    }

    // this method return a object with a subset of fields of record
    // the resulting object contains fields included in this.group
    private aggregationKey(record: any): any {
        let result: any = new Object();
        this.group.forEach((groupKey) => {
            result[groupKey] = record[groupKey];
        });
        return result;
    }

    private createRule(element: any): ApplyRule {
        const applyKey = Object.keys(element)[0];

        const contents: any = Object.values(element)[0];
        const token: string = Object.keys(contents)[0];
        const key: string = Object.values(contents)[0] as string;

        if (token.localeCompare("max", undefined, { sensitivity: "accent" }) === 0) {
            return new MaxRule(applyKey, key);
        } else if (token.localeCompare("min", undefined, { sensitivity: "accent" }) === 0) {
            return new MinRule(applyKey, key);
        } else if (token.localeCompare("avg", undefined, { sensitivity: "accent" }) === 0) {
            return new AverageRule(applyKey, key);
        } else if (token.localeCompare("count", undefined, { sensitivity: "accent" }) === 0) {
            return new CountRule(applyKey, key);
        } else if (token.localeCompare("sum", undefined, { sensitivity: "accent" }) === 0) {
            return new SumRule(applyKey, key);
        } else {
            throw new Error(`${token} does not match max, min, avg, count nor sum`);
        }
    }
}

class Subset {
    public key: any;
    public records: any[];

    constructor(key: any) {
        this.key = key;
        this.records = new Array();
    }

    public append(record: any) {
        this.records = this.records.concat(record);
    }

    public applyRules(rules: ApplyRule[]): any {
        let result: any = this.key;
        rules.forEach((rule) => {
            result[rule.applyKey] = rule.apply(this.records);
        });
        return result;
    }
}
