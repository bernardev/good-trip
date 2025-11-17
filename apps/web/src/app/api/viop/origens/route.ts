import { NextResponse } from "next/server";
import { Viop, type Origem } from "@/lib/viop";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    // 🔍 LOGS DE DEBUG
    console.log("=== VIOP ORIGENS DEBUG ===");
    console.log("📍 Query:", q);
    console.log("🔐 VIOP_BASE_URL:", process.env.VIOP_BASE_URL ? "✅ SET" : "❌ MISSING");
    console.log("🔐 VIOP_TENANT_ID:", process.env.VIOP_TENANT_ID ? "✅ SET" : "❌ MISSING");
    console.log("🔐 VIOP_USER:", process.env.VIOP_USER ? "✅ SET" : "❌ MISSING");
    console.log("🔐 VIOP_PASS:", process.env.VIOP_PASS ? "✅ SET" : "❌ MISSING");

    const items: Origem[] = await Viop.buscarOrigens(q);
    
    console.log("✅ Sucesso! Items retornados:", items.length);
    
    return NextResponse.json({ ok: true, items });
  } catch (e) {
    console.error("❌ ERRO COMPLETO:", e);
    console.error("❌ Stack:", e instanceof Error ? e.stack : "N/A");
    
    return NextResponse.json(
      { 
        ok: false, 
        error: e instanceof Error ? e.message : String(e),
        details: e instanceof Error ? e.stack : undefined
      }, 
      { status: 500 }
    );
  }
}