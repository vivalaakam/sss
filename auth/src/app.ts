import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import jose from "node-jose";
import dotenv from "dotenv";
import { keccak256, validateJWKS } from "shared";
import { Auth } from "./models/auth";

dotenv.config();

export const app = express();

app.use(express.json());
app.use(cors());

const cache = new Map<string, { validate: Record<string, any>; ks: object }>();

app.post("/api/exchange", async (req, res) => {
  const { token } = req.body;

  const encoded = jwt.decode(token);
  if (encoded === null || !encoded.hasOwnProperty("sub")) {
    res.status(400).json({ message: "Invalid token" });
    return;
  }

  const tokens = await Auth.findAll({});

  let isValid = false;
  for (const authToken of tokens) {
    try {
      if (!cache.get(authToken.get("id"))) {
        const k1 = await fetch(authToken.get("jwkUrl"));
        const k2 = await k1.json();
        if (k2) {
          cache.set(authToken.id, {
            validate: Object.fromEntries(
              authToken.get("checks").map((check) => [check.key, check.value]),
            ),
            ks: k2,
          });
        }
      }

      const c = cache.get(authToken.id);
      if (!c) {
        continue;
      }

      isValid = validateJWKS(token, c.ks, c.validate) || isValid;
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error(e);
    }
  }

  if (!isValid) {
    res.status(400).json({ message: "Invalid token" });
    return;
  }

  const keyStore = await jose.JWK.asKeyStore(
    (process.env.AUTH_KEYS as string).toString(),
  );
  const [key] = keyStore.all({ use: "sig" });
  const opt = { compact: true, jwk: key, fields: { typ: "jwt" } };
  const iat = Math.floor(Date.now() / 1000);
  const sub = keccak256(
    encoded.sub as string,
    process.env.AUTH_SECRET as string,
  );

  const payload = JSON.stringify({
    exp: iat + 1440 * 60,
    iat,
    sub,
    iss: "auth_app",
    aud: "auth_app",
  });

  const idToken = await jose.JWS.createSign(opt, key).update(payload).final();
  res.status(200).json({ idToken });
});

app.post("/api/certs", async (_req, res) => {
  const keyStore = await jose.JWK.asKeyStore(
    (process.env.AUTH_KEYS as string).toString(),
  );
  res.status(200).json(keyStore.toJSON());
});
