import { NextResponse } from "next/server";
import { Viop, type Origem } from "@/lib/viop";

// 🔵 CONFIG LOCAL — SEM .ENV
const PROXY = "https://goodtrip.com.br/proxy-viop.php";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    console.log("=== VIOP ORIGENS DEBUG ===");
    console.log("📍 Query:", q);
    console.log("🌐 Proxy:", PROXY);

    // 🔄 IMPORTANTE:
    // Vamos injetar o PROXY diretamente na classe Viop
    const items: Origem[] = await Viop.buscarOrigens(q, PROXY);

    console.log("✅ Sucesso! Items retornados:", items.length);

    return NextResponse.json({ ok: true, items });

  } catch (e) {
    console.error("❌ ERRO COMPLETO:", e);
    
    return NextResponse.json(
      { 
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        details: e instanceof Error ? e.stack : undefined,
      },
      { status: 500 }
    );
  }
}
