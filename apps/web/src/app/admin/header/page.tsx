"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import type { Settings, Header } from "@/../types/settings";
import { DEFAULT_HEADER_PRESET } from "@/../types/settings";

/** remove campos vazios antes de salvar */
const stripEmpty = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  ) as Partial<T>;

/** dedupe por href (mantém o primeiro) */
function dedupeByHref<T extends { href: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((it) => (seen.has(it.href) ? false : (seen.add(it.href), true)));
}

export default function HeaderAdminPage() {
  const [settings, setSettings] = useState<Settings>({ header: { nav: [] } as Header });
  const header: Header = settings.header ?? ({ nav: [] } as Header);

  // Carregar + merge com preset (como no Footer)
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/settings", { cache: "no-store" });
      const s: Settings = await r.json();

      const saved = s?.header ?? ({} as Header);

      const merged: Header = {
        ctaLabel: saved.ctaLabel ?? DEFAULT_HEADER_PRESET.ctaLabel,
        ctaHref:  saved.ctaHref  ?? DEFAULT_HEADER_PRESET.ctaHref,
        phone:    saved.phone    ?? DEFAULT_HEADER_PRESET.phone,
        whatsapp: saved.whatsapp ?? DEFAULT_HEADER_PRESET.whatsapp,
        nav: dedupeByHref([...(saved.nav ?? []), ...(DEFAULT_HEADER_PRESET.nav ?? [])]),
      };

      setSettings({ ...s, header: merged });
    })();
  }, []);

  // helpers
  const up = (patch: Partial<Header>) =>
    setSettings((prev) => ({ ...prev, header: { ...(prev.header ?? ({} as Header)), ...patch } }));

  const onLinkChange =
    (idx: number, field: "label" | "href") =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const list = [...(header.nav ?? [])];
      list[idx] = { ...list[idx], [field]: e.target.value };
      up({ nav: list });
    };

  const addLink = () => up({ nav: [ ...(header.nav ?? []), { label: "", href: "" } ] });
  const removeLink = (idx: number) => up({ nav: (header.nav ?? []).filter((_, i) => i !== idx) });

  const save = async () => {
    const cleanedNav = dedupeByHref((header.nav ?? []).filter((l) => l.label.trim() && l.href.trim()));
    const payload: Settings = {
      ...settings,
      header: { ...stripEmpty(header), nav: cleanedNav },
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
        <h1 className="text-xl font-semibold">Header</h1>
        <p className="text-white/70 text-sm mt-1">Edite CTA, contatos e navegação.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-white/80">CTA (rótulo)</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/[.06] border border-white/10 p-3"
              value={header.ctaLabel ?? ""}
              onChange={(e) => up({ ctaLabel: e.target.value })}
              placeholder="Ex.: Buscar agora"
            />
          </div>
          <div>
            <label className="text-sm text-white/80">CTA (link)</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/[.06] border border-white/10 p-3"
              value={header.ctaHref ?? ""}
              onChange={(e) => up({ ctaHref: e.target.value })}
              placeholder="/buscar ou https://…"
            />
          </div>
          <div>
            <label className="text-sm text-white/80">Telefone</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/[.06] border border-white/10 p-3"
              value={header.phone ?? ""}
              onChange={(e) => up({ phone: e.target.value })}
              placeholder="(11) 0000-0000"
            />
          </div>
          <div>
            <label className="text-sm text-white/80">WhatsApp</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/[.06] border border-white/10 p-3"
              value={header.whatsapp ?? ""}
              onChange={(e) => up({ whatsapp: e.target.value })}
              placeholder="https://wa.me/..."
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Menu (links)</h2>
            <button
              onClick={addLink}
              className="rounded-lg border border-white/15 bg-white/5 px-3 h-9 text-sm hover:bg-white/10"
            >
              + Adicionar link
            </button>
          </div>

        <div className="mt-3 space-y-3">
          {(header.nav ?? []).map((l, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className="rounded-xl bg-white/[.06] border border-white/10 p-3"
                placeholder="Rótulo (ex.: Destinos)"
                value={l.label}
                onChange={onLinkChange(i, "label")}
              />
              <input
                className="rounded-xl bg-white/[.06] border border-white/10 p-3"
                placeholder="Href (ex.: /destinos)"
                value={l.href}
                onChange={onLinkChange(i, "href")}
              />
              <button
                onClick={() => removeLink(i)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 h-12 text-sm hover:bg-white/10"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
        </div>

        <div className="mt-6">
          <button onClick={save} className="rounded-xl bg-primary px-5 h-11 font-semibold hover:opacity-95">
            Salvar
          </button>
        </div>
      </div>
    </section>
  );
}
