import chai = require("chai");

export class ServerTestUtil {
    public static putDataset(address: string, id: string, kind: string, dataset: Buffer): ChaiHttp.Request {
        return chai.request(address)
            .put(`/dataset/${id}/${kind}`)
            .send(dataset)
            .set("Content-Type", "application/x-zip-compressed");
    }
}
