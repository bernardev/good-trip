import { NextRequest, NextResponse } from "next/server";

// URL fixa do seu proxy na HostGator
const PROXY = "https://goodtrip.com.br/proxy-viop.php";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const origemId  = Number(p.get("origemId"));
  const destinoId = Number(p.get("destinoId"));
  const data      = p.get("data"); // YYYY-MM-DD

  if (!origemId || !destinoId || !data) {
    return NextResponse.json(
      { error: "origemId, destinoId, data são obrigatórios" },
      { status: 400 }
    );
  }

  // Todos os bodies que você testava seguem iguais
  const candidates: Record<string, unknown>[] = [
    { idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId, data },
    { idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId, dataViagem: data },
    { origemId, destinoId, data },
    { origem: origemId, destino: destinoId, data },
    { idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId, data, servico: "CONV" },
    { idLocalidadeOrigem: origemId, idLocalidadeDestino: destinoId, data, servicoId: 1 },
  ];

  for (const body of candidates) {
    // ❗ Agora você envia TUDO para o proxy
    const url = `${PROXY}?path=consultacorrida/buscaCorrida`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await r.text().catch(() => "");

    if (r.ok) {
      let json: unknown = null;
      try { json = text ? JSON.parse(text) : null; } catch {}

      return NextResponse.json(
        {
          usedBody: body,
          status: r.status,
          json,
          sample: text.slice(0, 500),
        },
        { status: 200 }
      );
    }
  }

  return NextResponse.json(
    { error: "Nenhum formato aceito" },
    { status: 422 }
  );
}
