import { NextResponse } from "next/server";

// 🧪 TESTE DO PROXY HOSTGATOR
const PROXY_URL = "https://goodtrip.com.br/proxy-viop.php";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = `${PROXY_URL}?path=/localidade/buscaOrigem`;
    
    console.log("🧪 TESTE PROXY HOSTGATOR");
    console.log("URL:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
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
          error: "Proxy retornou erro",
          status: response.status,
          response: text 
        },
        { status: response.status }
      );
    }
    
    const data = JSON.parse(text);
    
    return NextResponse.json({ 
      ok: true, 
      message: "✅ Sucesso! Proxy funcionou",
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