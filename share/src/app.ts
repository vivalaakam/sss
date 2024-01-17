import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createHash } from "crypto";
import { Storage } from "./models/storage";
import { decrypt, encrypt, PrivateKey } from "eciesjs";

dotenv.config();

export const app = express();

app.use(express.json());
app.use(cors());

interface RequestWithUID extends Request {
  uid?: Buffer;
}

function authMiddleware(
  req: RequestWithUID,
  res: Response,
  next: NextFunction,
) {
  const { token } = req.body;

  const encoded = jwt.decode(token);

  if (encoded === null || !encoded.hasOwnProperty("sub")) {
    return res.status(400).json({ message: "Invalid token" });
  }

  req.uid = createHash("sha256")
    .update(Buffer.from(encoded.sub as string, "utf-8"))
    .update(Buffer.from(process.env.AUTH_SECRET as string, "utf-8"))
    .digest();

  next();
}

app.post(
  "/api/get",
  authMiddleware,
  async (req: RequestWithUID, res: Response) => {
    const sk = new PrivateKey(req.uid as Buffer);

    const encrypted = await Storage.findByPk(sk.publicKey.toHex());

    if (encrypted === null) {
      return res.status(404).json({ message: "Not found" });
    }

    const data = Buffer.from(encrypted.get("value"), "base64");
    res.status(200).json({
      key: sk.publicKey.toHex(),
      data: decrypt(sk.secret, data).toString(),
    });
  },
);

app.post(
  "/api/set",
  authMiddleware,
  async (req: RequestWithUID, res: Response) => {
    const sk = new PrivateKey(req.uid as Buffer);

    const decData = encrypt(
      sk.publicKey.toHex(),
      Buffer.from(req.body.data as string, "utf-8"),
    );

    await Storage.create({
      id: sk.publicKey.toHex(),
      value: decData.toString("base64"),
    });

    const encrypted = await Storage.findByPk(sk.publicKey.toHex());

    if (encrypted === null) {
      return res.status(404).json({ message: "Not found" });
    }

    const encData = Buffer.from(encrypted.get("value"), "base64");
    res.status(200).json({
      key: sk.publicKey.toHex(),
      data: decrypt(sk.secret, encData).toString(),
    });
  },
);
