import { NextRequest, NextResponse } from "next/server";

// 🔵 PROXY FIXO — SEM .ENV
const PROXY = "https://goodtrip.com.br/proxy-viop.php";

// -----------------------------------------------------------------------------------

const dates = (d: string) => ([
  d,
  `${d}T00:00:00.000Z`,
  d.split("-").reverse().join("/")
]);

function variants(o: string, de: string, d: string) {
  const ds = dates(d);

  return [
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
}

// -----------------------------------------------------------------------------------

async function tryOne(body: object) {
  // 👇 Agora enviando via PROXY
  const url = `${PROXY}?endpoint=consultacorrida/buscaCorrida`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");

  return {
    ok: res.ok,
    status: res.status,
    body,
    sample: text.slice(0, 240)
  };
}

// -----------------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const origemId = p.get("origemId")!;
  const destinoId = p.get("destinoId")!;
  const data      = p.get("data")!;

  const tries = variants(origemId, destinoId, data);
  const results = [];

  for (const t of tries) {
    try {
      results.push(await tryOne(t));
    } catch (e) {
      results.push({ ok: false, status: 0, body: t, sample: String(e) });
    }
  }

  return NextResponse.json(results);
}
