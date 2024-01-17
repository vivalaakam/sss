import {sequelizeConnection} from "../src/models/connection";
import request from "supertest";
import {app} from "../src/app";
import elliptic from 'elliptic';
import {keccak256} from "shared";

const ec = new elliptic.ec('secp256k1');
describe("Share service", () => {
    let token: string | null;

    beforeAll(async () => {
        await sequelizeConnection.sync();
    });


    it("should return saved metadata", async () => {
        const key = ec.genKeyPair();
        const ts = Math.floor(Date.now() / 1000)
        const msgHash = keccak256(`test:${ts}`);
        const signature = key.sign(msgHash, 'hex');

        const resp = await request(app)
            .post("/api/get")
            .send({
                pk: key.getPublic('hex'),
                namespace: 'test',
                signature,
                ts
            });

        expect(resp.statusCode).toBe(404);

        const resp2 = await request(app)
            .post("/api/set")
            .send({
                pk: key.getPublic('hex'),
                namespace: 'test',
                signature,
                ts,
                message: 'my secret data'
            });

        expect(resp2.statusCode).toBe(200);

        expect(resp2.body).toBe("my secret data");

        const resp3 = await request(app)
            .post("/api/get")
            .send({
                pk: key.getPublic('hex'),
                namespace: 'test',
                signature,
                ts,
            });

        expect(resp3.statusCode).toBe(200);
        expect(resp3.body).toEqual(resp2.body);
    });
});