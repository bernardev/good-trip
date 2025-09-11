import express, { Request, Response } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();

const FRONT_ORIGIN = process.env.FRONT_ORIGIN ?? "http://localhost:3000";
app.use(cors({ origin: [FRONT_ORIGIN], credentials: true }));
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "goodtrip-api", ts: new Date().toISOString() });
});

app.get("/v1/ping", (_req: Request, res: Response) => res.json({ pong: true }));

app.get("/v1/search", (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  res.json({ query: q, results: [] });
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
