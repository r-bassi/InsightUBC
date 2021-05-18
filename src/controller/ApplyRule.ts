import Decimal from "decimal.js";

export abstract class ApplyRule  {
    public applyKey: string;
    protected key: string;

    constructor(applyKey: string, key: string) {
        this.applyKey = applyKey;
        this.key = key.split("_")[1];
    }

    public abstract apply (records: any[]): number;
}

export class MaxRule extends ApplyRule {
    public apply(records: any[]): number {
        let result: number = -Number.MAX_VALUE;
        records.forEach((record) => {
            if (record[this.key] > result) {
                result = record[this.key];
            }
        });
        return result;
    }
}

export class MinRule extends ApplyRule {
    public apply(records: any[]): number {
        let result: number = Number.MAX_VALUE;
        records.forEach((record) => {
            if (record[this.key] < result) {
                result = record[this.key];
            }
        });
        return result;
    }
}

export class AverageRule extends ApplyRule {
    public apply(records: any[]): number {
        let total: Decimal = new Decimal(0);
        let count: number = 0;
        records.forEach((element) => {
            count += 1;
            let curr: Decimal = new Decimal(element[this.key]);
            total = total.add(curr);
        });
        let avg = total.toNumber() / count;
        return Number(avg.toFixed(2));
    }
}

export class CountRule extends ApplyRule {
    public apply(records: any[]): number {
        let set: Set<any> = new Set<any>();
        records.forEach((record) => {
            set.add(record[this.key]);
        });
        return set.size;
    }
}

export class SumRule extends ApplyRule {
    public apply(records: any[]): number {
        let result: number = 0;
        records.forEach((element) => {
            result = result + element[this.key];
        });
        return Number(result.toFixed(2));
    }
}
