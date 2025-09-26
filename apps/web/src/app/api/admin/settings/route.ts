export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { SettingsSchema, type Settings, DEFAULT_SETTINGS } from "@/../types/settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const FILE = path.join(process.cwd(), ".data.settings.json");

function read(): Settings {
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const json = JSON.parse(raw) as unknown;
    const parsed = SettingsSchema.safeParse(json);
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}
function write(data: Settings) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function GET() {
  return NextResponse.json(read());
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;
  if (!isAdmin) return NextResponse.json({ ok:false }, { status: 401 });

  const body = (await req.json()) as unknown;
  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false }, { status: 400 });

  write(parsed.data);
  return NextResponse.json({ ok:true });
}
