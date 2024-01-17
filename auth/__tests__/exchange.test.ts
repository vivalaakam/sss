import request from "supertest";
import jose from "node-jose";
import {app} from "../src/app";
import jwt from "jsonwebtoken";
import {sequelizeConnection} from "../src/models/connection";
import {Auth} from "../src/models/auth";


describe("POST /api/exchange", () => {
    let ks: jose.JWK.KeyStore | null;

    beforeAll(async () => {
        await sequelizeConnection.sync();
        let store = await jose.JWK.createKeyStore().generate("RSA", 2048, {alg: "RS256", use: "sig"})
        ks = await jose.JWK.asKeyStore({keys: [store]});

        let publicKey = ks.toJSON(false);

        await Auth.create({
            id: "test_app",
            name: "Test App",
            jwkUrl: `data:,${JSON.stringify(publicKey)}`,
            verifier: "test_app",
            checks: [{key: 'iss', value: 'test_app'}, {key: 'aud', value: 'test_app'}]
        })
    });


    it("should exchange token", async () => {
        expect(ks).not.toBeNull();
        if (!ks) {
            throw new Error("ks is null");
        }
        const [key] = ks.all({use: "sig"});

        const opt = {compact: true, jwk: key, fields: {typ: "jwt"}};

        const iat = Math.floor(Date.now() / 1000);

        const payload = JSON.stringify({
            exp: iat + 1440 * 60,
            iat: iat,
            sub: "test_user@test_app",
            iss: "test_app",
            aud: "test_app"
        });

        const token = await jose.JWS.createSign(opt, key).update(payload).final();

        const resp = await request(app)
            .post("/api/exchange")
            .send({token})
            .expect(200);

        expect(resp.statusCode).toBe(200);
        let encoded = jwt.decode(resp.body.idToken);

        expect(encoded).not.toBeNull();
        expect(encoded).toHaveProperty('sub');
        expect(encoded?.sub).toBe('7a2880eadf41de32d42804896391a780e592435a7e50e3a5f283c6f0ea18995d');
    });
});
