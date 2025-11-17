// apps/web/src/app/api/distribusion/cities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DistribusionReverseAdapter } from "@/services/distribusion-reverse-adapter";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";
  const adapter = new DistribusionReverseAdapter(process.env.DISTRIBUSION_PARTNER ?? "814999");
  const all = await adapter.getCities();
  const items = q ? all.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)) : all;
  return NextResponse.json({ ok: true, items: items.slice(0, 25) });
}
