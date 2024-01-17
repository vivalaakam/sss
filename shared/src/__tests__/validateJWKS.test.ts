import { validateJWKS } from "../validateJWKS";
import jose from "node-jose";

describe("validateJWKS", () => {
  let store1: jose.JWK.KeyStore | null;
  let store2: jose.JWK.KeyStore | null;

  beforeAll(async () => {
    store1 = await jose.JWK.createKeyStore()
      .generate("RSA", 2048, { alg: "RS256", use: "sig" })
      .then((store) => jose.JWK.asKeyStore({ keys: [store] }));
    store2 = await jose.JWK.createKeyStore()
      .generate("RSA", 2048, { alg: "RS256", use: "sig" })
      .then((store) => jose.JWK.asKeyStore({ keys: [store] }));
  });

  it("should validate tokens", async () => {
    if (!store1) {
      throw new Error("store1 is null");
    }

    const [key] = store1.all({ use: "sig" });
    const opt = { compact: true, jwk: key, fields: { typ: "jwt" } };

    const iat = Math.floor(Date.now() / 1000);

    const payload = JSON.stringify({
      exp: iat + 1440 * 60,
      iat,
      sub: "test_user@test_app",
      iss: "test_app",
      aud: "test_app",
    });

    const token = await jose.JWS.createSign(opt, key).update(payload).final();

    const isValid = validateJWKS(token.toString(), store1.toJSON(), {});
    expect(isValid).toBe(true);
  });

  it("should not validate tokens", async () => {
    if (!store1) {
      throw new Error("store1 is null");
    }

    if (!store2) {
      throw new Error("store1 is null");
    }

    const [key] = store1.all({ use: "sig" });

    const opt = { compact: true, jwk: key, fields: { typ: "jwt" } };

    const iat = Math.floor(Date.now() / 1000);

    const payload = JSON.stringify({
      exp: iat + 1440 * 60,
      iat,
      sub: "test_user@test_app",
      iss: "test_app",
      aud: "test_app",
    });

    const token = await jose.JWS.createSign(opt, key).update(payload).final();
    const isValid = validateJWKS(token.toString(), store2.toJSON(), {});
    expect(isValid).toBe(false);
  });

  it("should not validate tokens if invalid params", async () => {
    if (!store1) {
      throw new Error("store1 is null");
    }

    const [key] = store1.all({ use: "sig" });
    const opt = { compact: true, jwk: key, fields: { typ: "jwt" } };

    const iat = Math.floor(Date.now() / 1000);

    const payload = JSON.stringify({
      exp: iat + 1440 * 60,
      iat,
      sub: "test_user@test_app",
      iss: "test_app",
      aud: "test_app",
    });

    const token = await jose.JWS.createSign(opt, key).update(payload).final();

    const isValid = validateJWKS(token.toString(), store1.toJSON(), {
      iss: "test_app2",
    });
    expect(isValid).toBe(false);
  });

  it("should not validate tokens if expired", async () => {
    if (!store1) {
      throw new Error("store1 is null");
    }

    const [key] = store1.all({ use: "sig" });
    const opt = { compact: true, jwk: key, fields: { typ: "jwt" } };

    const iat = Math.floor(Date.now() / 1000) - 1440 * 65;

    const payload = JSON.stringify({
      exp: iat + 1440 * 60,
      iat,
      sub: "test_user@test_app",
      iss: "test_app",
      aud: "test_app",
    });

    const token = await jose.JWS.createSign(opt, key).update(payload).final();

    const isValid = validateJWKS(token.toString(), store1.toJSON(), {
      iss: "test_app",
    });
    expect(isValid).toBe(false);
  });
});
