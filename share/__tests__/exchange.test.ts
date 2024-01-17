import jose from "node-jose";
import {sequelizeConnection} from "../src/models/connection";
import request from "supertest";
import {app} from "../src/app";

describe("Share service", () => {
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
    });


    it("should return saved shares", async () => {
        const resp = await request(app)
            .post("/api/get")
            .send({token});

        expect(resp.statusCode).toBe(404);

        const resp2 = await request(app)
            .post("/api/set")
            .send({token, data: 'my secret data'});

        expect(resp2.statusCode).toBe(200);


        expect(resp2.body.data).toBe("my secret data");

        const resp3 = await request(app)
            .post("/api/get")
            .send({token});

        expect(resp3.statusCode).toBe(200);
        expect(resp3.body).toEqual(resp2.body);
    });
});