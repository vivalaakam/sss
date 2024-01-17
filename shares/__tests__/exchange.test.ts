import request from "supertest";
import jose from "node-jose";
import {app} from "../src/app";
import {sequelizeConnection} from "../src/models/connection";
import {Node} from "../src/models/node";

describe("POST /api/get", () => {
    let token: string | null;

    beforeAll(async () => {
        await sequelizeConnection.sync();
        const store = await jose.JWK.createKeyStore().generate("RSA", 2048, {alg: "RS256", use: "sig"})
        const keyStore = await jose.JWK.asKeyStore({keys: [store]});
        const [key] = keyStore.all({use: "sig"});
        const opt = {compact: true, jwk: key, fields: {typ: "jwt"}};

        const iat = Math.floor(Date.now() / 1000);

        const payload = JSON.stringify({
            exp: iat + 1440 * 60,
            iat: iat,
            sub: "test_user@test_app",
            iss: "test_app",
            aud: "test_app"
        });

        token = (await jose.JWS.createSign(opt, key).update(payload).final()).toString();

        for (let i = 0; i < 6; i += 1) {
            await Node.create({
                id: `node_${i}`,
                name: `node_${i}`,
                value: `node_${i}`
            });
        }
    });


    it("should return saved shares", async () => {
        const resp = await request(app)
            .post("/api/get")
            .send({token});

        expect(resp.statusCode).toBe(404);

        const resp2 = await request(app)
            .post("/api/generate")
            .send({token});

        expect(resp2.statusCode).toBe(200);
        console.log('resp2.body', resp2.body);
        expect(resp2.body).toHaveLength(5);

        let usedNodes = new Set<string>([...resp2.body.map((r: { node: any; }) => r.node)]);

        expect(usedNodes.size).toBe(5);

        const resp3 = await request(app)
            .post("/api/get")
            .send({token});

        expect(resp3.statusCode).toBe(200);

        expect(resp3.body).toHaveLength(5);
        expect(resp3.body).toEqual(resp2.body);

    });
});