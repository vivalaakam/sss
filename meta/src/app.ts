import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Storage } from "./models/storage";
import elliptic from "elliptic";
import { keccak256 } from "shared";

dotenv.config();

export const app = express();

app.use(express.json());
app.use(cors());

const ec = new elliptic.ec("secp256k1");

app.post("/api/get", async (req: Request, res: Response) => {
  const { pk, namespace, signature, ts } = req.body;
  const msgHash = Buffer.from(keccak256(`${namespace}:${ts}`), "hex");

  const isValid = ec.verify(msgHash, signature, Buffer.from(pk, "hex"), "hex");

  if (!isValid || ts < Math.floor(Date.now() / 1000) - 60) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  const key = keccak256(`${pk}:${namespace}`);
  const data = await Storage.findByPk(key);

  if (data === null) {
    return res.status(404).json({ message: "Not found" });
  }

  res.status(200).json(data.get("value"));
});

app.post("/api/set", async (req: Request, res: Response) => {
  const { pk, namespace, signature, ts, message } = req.body;
  const msgHash = Buffer.from(keccak256(`${namespace}:${ts}`), "hex");
  const isValid = ec.verify(msgHash, signature, pk, "hex");

  if (!isValid || ts < Math.floor(Date.now() / 1000) - 60) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  const key = keccak256(`${pk}:${namespace}`);

  await Storage.create({
    id: key,
    value: message,
  });

  const data = await Storage.findByPk(key);

  if (data === null) {
    return res.status(404).json({ message: "Not found" });
  }

  res.status(200).json(data.get("value"));
});
