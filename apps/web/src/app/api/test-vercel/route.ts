import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const url = "https://apiouroprata.rjconsultores.com.br/api-gateway/localidade/buscaOrigem";
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "36906f34-b731-46bc-a19d-a6d8923ac2e7",
        "authorization": "Basic R09PRFRSSVBBUEk6QGcxdDIj",
      },
      cache: "no-store",
    });
    
    const text = await response.text();
    
    return NextResponse.json({ 
      status: response.status,
      ok: response.ok,
      data: text.substring(0, 500)
    });
    
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}