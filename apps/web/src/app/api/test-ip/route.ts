// apps/web/src/app/api/test-ip/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Busca IP de um serviço externo
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    
    return NextResponse.json({
      ip: data.ip,
      message: "Este é o IP que o Vercel está usando para fazer requisições externas"
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar IP" }, { status: 500 });
  }
}