// app/api/admin/settings/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { SettingsSchema, DEFAULT_SETTINGS, type Settings } from "@/../types/settings";
import { loadSettings, saveSettings } from "@/lib/settingsStore";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const data = await loadSettings();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;
  if (!isAdmin) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const incomingUnknown = await req.json();
    const incoming = SettingsSchema.parse(incomingUnknown);

    const current = await loadSettings();
    const next: Settings = {
      ...DEFAULT_SETTINGS,
      ...current,
      ...incoming,
      banner: { ...(current.banner ?? {}), ...(incoming.banner ?? {}) },
      header: { ...(current.header ?? {}), ...(incoming.header ?? {}) },
      footer: { ...(current.footer ?? {}), ...(incoming.footer ?? {}) },
    };

    await saveSettings(next);
    return NextResponse.json(next); // seu admin só checa res.ok; retornar o objeto ajuda no futuro
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
