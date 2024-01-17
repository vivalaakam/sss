import express, {NextFunction, Request, Response} from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import {createHash, randomBytes} from 'crypto';
import {Storage} from "./models/storage";
import {Node} from "./models/node";

dotenv.config();

export const app = express();

app.use(express.json());
app.use(cors());

interface RequestWithUID extends Request {
    uid?: string;
}

function authMiddleware(req: RequestWithUID, res: Response, next: NextFunction) {
    let {token} = req.body;

    let encoded = jwt.decode(token);
    console.log('encoded', encoded, token);
    if (encoded === null || !encoded.hasOwnProperty('sub')) {
        return res.status(400).json({message: "Invalid token"});
    }

    req.uid = createHash('sha256')
        .update(Buffer.from(encoded.sub as string, "utf-8"))
        .update(Buffer.from(process.env.AUTH_SECRET as string, "utf-8"))
        .digest()
        .toString('hex')

    next();
}

app.post("/api/get", authMiddleware, async (req: RequestWithUID, res: Response) => {
    const value = await Storage.findByPk(req.uid);

    if (value === null) {
        return res.status(404).json({message: "Node not found"});
    }

    res.status(200).json(value.get('value'));
});

app.post("/api/generate", authMiddleware, async (req: RequestWithUID, res: Response) => {
    let nodes = await Node.findAll({});

    if (nodes.length < 5) {
        return res.status(400).json({message: "Not enough nodes"});
    }

    const values = nodes
        .map((node) => node.get('value'))
        .sort(() => Math.random() - 0.5).slice(0, 5)
        .map((node) => ({
            node: node,
            index: randomBytes(32).toString('hex')
        }));


    await Storage.create({
        id: req.uid,
        value: values
    });

    const value = await Storage.findByPk(req.uid);

    if (value === null) {
        return res.status(404).json({message: "Node not found"});
    }

    res.status(200).json(value.get('value'));
});
