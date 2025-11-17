import { NextRequest, NextResponse } from "next/server";
import { ViopPath } from "@/lib/viop";

const BASE   = process.env.VIOP_BASE_URL!;
const TENANT = process.env.VIOP_TENANT_ID!;
const USER   = process.env.VIOP_USER!;
const PASS   = process.env.VIOP_PASS!;
const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

const dates = (d: string) => ([
  d,                         // "2025-11-15"
  `${d}T00:00:00.000Z`,      // ISO
  d.split("-").reverse().join("/"), // "15/11/2025"
]);

function variants(o: string, de: string, d: string) {
  const ds = dates(d);
  const base = [
    { origemId: o, destinoId: de, data: ds[0] },
    { origemId: o, destinoId: de, data: ds[1] },
    { origemId: o, destinoId: de, data: ds[2] },

    { origem: o, destino: de, data: ds[0] },
    { origem: o, destino: de, data: ds[2] },

    { idOrigem: o, idDestino: de, data: ds[0] },

    { origemId: o, destinoId: de, data: ds[0], quantidade: 1 },
    { origemId: o, destinoId: de, data: ds[0], passageiros: 1 },

    { origemId: o, destinoId: de, data: ds[0], empresa: "VOP" },
    { origemId: o, destinoId: de, data: ds[0], servico: "CONV" },
  ];
  return base;
}

async function tryOne(body: object) {
  const res = await fetch(`${BASE}${ViopPath.consultacorrida.buscar()}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tenant-id": TENANT,
      authorization: AUTH,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body, sample: text.slice(0, 240) };
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const origemId = p.get("origemId")!;
  const destinoId = p.get("destinoId")!;
  const data = p.get("data")!;

  const tries = variants(origemId, destinoId, data);
  const out = [];
  for (const t of tries) {
    try {
      out.push(await tryOne(t));
    } catch (e) {
      out.push({ ok: false, status: 0, body: t, sample: String(e) });
    }
  }
  return NextResponse.json(out);
}
