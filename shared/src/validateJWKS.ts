import { createPublicKey } from "node:crypto";
import jwt from "jsonwebtoken";

export function validateJWKS(
  jwtKey: string,
  data: object | string,
  validate: Record<string, any>,
) {
  const keys = typeof data === "object" ? data : JSON.parse(data);
  let k = keys.keys ? keys.keys : keys;

  if (!Array.isArray(k)) {
    k = [k];
  }

  for (const jwk of k) {
    const key = createPublicKey({ format: "jwk", key: jwk });
    const spki = key.export({ format: "pem", type: "spki" });

    try {
      const result = jwt.verify(jwtKey, spki, validate) as Record<string, any>;

      const valid = Object.entries(validate).every(([key, value]) => {
        return result[key] === value;
      });

      if (!valid) {
        throw new Error("Invalid token");
      }

      return true;
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.log(e);
    }
  }

  return false;
}
