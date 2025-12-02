import { NextResponse } from "next/server";

// Teste DIRETO com a API VIOP (sem proxy)
const VIOP_BASE = "https://apiouroprata.rjconsultores.com.br/api-gateway";
const TENANT = "36906f34-b731-46bc-a19d-a6d8923ac2e7";
const AUTH = "Basic R09PRFRSSVBBUEk6QGcxdDIj";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = `${VIOP_BASE}/localidade/buscaOrigem`;
    
    console.log("🧪 TESTE DIRETO (SEM PROXY)");
    console.log("URL:", url);
    
    const headers = {
      "content-type": "application/json",
      "x-tenant-id": TENANT,
      "user-agent": "GoodTrip/1.0",
      "authorization": AUTH,
    };
    
    console.log("Headers:", headers);
    
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    
    console.log("Status:", response.status);
    console.log("OK:", response.ok);
    
    const text = await response.text();
    console.log("Response (primeiros 500 chars):", text.substring(0, 500));
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "API VIOP retornou erro",
          status: response.status,
          response: text 
        },
        { status: response.status }
      );
    }
    
    const data = JSON.parse(text);
    
    return NextResponse.json({ 
      ok: true, 
      message: "✅ Sucesso! API VIOP respondeu direto",
      items: data,
      count: Array.isArray(data) ? data.length : 0
    });
    
  } catch (e) {
    console.error("❌ ERRO:", e);
    return NextResponse.json(
      { 
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}