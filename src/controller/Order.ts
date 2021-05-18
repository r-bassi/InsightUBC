export class Order {
    private readonly multiple: number;
    private readonly keys: string[];

    constructor(dir: string, keys: string[]) {
        // todo: validate the dir is either up or down
        this.multiple = dir
            .localeCompare("up", "en", { sensitivity: "base" }) === 0 ? 1 : -1;
        this.keys = keys;
    }

    public compare(l: any, r: any): number {
        let result: number = 0;
        for (const elem of this.keys) {
            if (l[elem] > r[elem]) {
                result = 1;
                break;
            } else if (l[elem] < r[elem]) {
                result = -1;
                break;
            } else {
                continue;
            }
        }

        return (this.multiple * result);
    }
}
