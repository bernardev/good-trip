// apps/web/src/app/api/viop-proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

const VIOP_BASE = "https://apiouroprata.rjconsultores.com.br/api-gateway";
const TENANT = "36906f34-b731-46bc-a19d-a6d8923ac2e7";
const AUTH = "Basic R09PRFRSSVBBUEk6QGcxdDIj";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return handleProxy(req, "GET");
}

export async function POST(req: NextRequest) {
  return handleProxy(req, "POST");
}

async function handleProxy(req: NextRequest, method: "GET" | "POST") {
  try {
    // Pega o path do query parameter
    const path = req.nextUrl.searchParams.get("path") || "";
    const url = `${VIOP_BASE}${path}`;
    
    console.log("🔄 PROXY VERCEL:", { method, url });
    
    const headers = {
      "content-type": "application/json",
      "x-tenant-id": TENANT,
      "user-agent": "GoodTrip/1.0",
      "authorization": AUTH,
    };
    
    const fetchOptions: RequestInit = {
      method,
      headers,
      cache: "no-store",
    };
    
    // Para POST, adiciona o body
    if (method === "POST") {
      const body = await req.text();
      if (body) {
        fetchOptions.body = body;
      }
    }
    
    const response = await fetch(url, fetchOptions);
    const data = await response.text();
    
    console.log("✅ Status:", response.status);
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "content-type": "application/json",
      },
    });
    
  } catch (error) {
    console.error("❌ Erro no proxy:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}