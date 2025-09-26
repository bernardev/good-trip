"use client";
import { useEffect, useState } from "react";
import type { Settings, Banner } from "@/../types/settings";

// remove "", null, undefined
const stripEmpty = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  ) as Partial<T>;

export default function BannerPage() {
  const [settings, setSettings] = useState<Settings>({ banner: {} });
  const banner: Banner = settings.banner ?? {};

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/settings", { cache: "no-store" });
      const s: Settings = await r.json();
      setSettings(s ?? { banner: {} });
    })();
  }, []);

  const update = (patch: Partial<Banner>) =>
    setSettings((prev) => ({ ...prev, banner: { ...(prev.banner ?? {}), ...patch } }));

  const save = async () => {
    const payload: Settings = {
      ...settings,
      banner: stripEmpty(banner) as Banner, // evita 400 do Zod (p.ex. bgUrl: "")
    };

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    alert(res.ok ? "Salvo" : "Erro ao salvar");
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">Banner</h1>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <input
            className="rounded-xl bg-white/[.06] border border-white/10 p-3 sm:col-span-2"
            placeholder="Título"
            value={banner.title ?? ""}
            onChange={(e) => update({ title: e.target.value })}
          />
          <input
            className="rounded-xl bg-white/[.06] border border-white/10 p-3 sm:col-span-2"
            placeholder="Subtítulo"
            value={banner.subtitle ?? ""}
            onChange={(e) => update({ subtitle: e.target.value })}
          />
          <input
            className="rounded-xl bg-white/[.06] border border-white/10 p-3"
            placeholder="CTA (rótulo)"
            value={banner.ctaLabel ?? ""}
            onChange={(e) => update({ ctaLabel: e.target.value })}
          />
          <input
            className="rounded-xl bg-white/[.06] border border-white/10 p-3"
            placeholder="Imagem (URL)"
            value={banner.bgUrl ?? ""}
            onChange={(e) => update({ bgUrl: e.target.value })}
          />
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={save} className="rounded-xl bg-primary px-5 h-11 font-semibold hover:opacity-95">
            Salvar
          </button>
          {banner.bgUrl ? (
            <a
              href={banner.bgUrl}
              target="_blank"
              className="h-11 grid place-items-center px-4 rounded-xl border border-white/15 bg-white/5"
            >
              Ver imagem
            </a>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div>
            <label className="text-sm text-white/80">Cor do título</label>
            <input type="color" className="mt-1 h-11 w-full rounded-xl bg-white/[.06] border border-white/10 p-2"
              value={(banner.textColor as string) ?? "#ffffff"}
              onChange={(e)=>update({ textColor: e.target.value })}/>
          </div>

          <div>
            <label className="text-sm text-white/80">Cor do subtítulo</label>
            <input type="color" className="mt-1 h-11 w-full rounded-xl bg-white/[.06] border border-white/10 p-2"
              value={(banner.subtitleColor as string) ?? "#e5e7eb"}
              onChange={(e)=>update({ subtitleColor: e.target.value })}/>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm text-white/80">Overlay (escurecer imagem)</label>
            <input type="range" min={0} max={0.9} step={0.05}
              className="mt-2 w-full"
              value={(banner.overlay as number) ?? 0.4}
              onChange={(e)=>update({ overlay: Number(e.target.value) })}/>
          </div>
        </div>
      </div>
    </section>
  );
}
