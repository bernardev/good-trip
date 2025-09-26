"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import type { Settings, Footer } from "@/../types/settings";
import { DEFAULT_FOOTER_PRESET } from "@/../types/settings";

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

export default function FooterAdminPage() {
  const [settings, setSettings] = useState<Settings>({
    footer: { links: [], socials: [] } as Footer,
  });

  const footer: Footer = settings.footer ?? ({ links: [], socials: [] } as Footer);

  // Carregar + merge com preset
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/settings", { cache: "no-store" });
      const s: Settings = await r.json();

      const saved = s?.footer ?? ({} as Footer);

      const merged: Footer = {
        cnpj: saved.cnpj ?? DEFAULT_FOOTER_PRESET.cnpj,
        address: saved.address ?? DEFAULT_FOOTER_PRESET.address,
        links: dedupeByHref([...(saved.links ?? []), ...(DEFAULT_FOOTER_PRESET.links ?? [])]),
        socials: dedupeByHref([
          ...(saved.socials ?? []),
          ...(DEFAULT_FOOTER_PRESET.socials ?? []),
        ]),
      };

      setSettings({ ...s, footer: merged });
    })();
  }, []);

  // Mutadores de estado
  const up = (patch: Partial<Footer>) =>
    setSettings((prev) => ({ ...prev, footer: { ...(prev.footer ?? ({} as Footer)), ...patch } }));

  // Links (institucionais)
  const onLinkChange =
    (idx: number, field: "label" | "href") =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const list = [...(footer.links ?? [])];
      list[idx] = { ...list[idx], [field]: e.target.value };
      up({ links: list });
    };

  const addLink = () => up({ links: [ ...(footer.links ?? []), { label: "", href: "" } ] });
  const removeLink = (idx: number) => up({ links: (footer.links ?? []).filter((_, i) => i !== idx) });

  // Socials
  const onSocialChange =
    (idx: number, field: "network" | "href") =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const list = [...(footer.socials ?? [])];
      list[idx] = { ...list[idx], [field]: e.target.value };
      up({ socials: list });
    };

  const addSocial = () =>
    up({ socials: [ ...(footer.socials ?? []), { network: "", href: "" } ] });
  const removeSocial = (idx: number) =>
    up({ socials: (footer.socials ?? []).filter((_, i) => i !== idx) });

  // Salvar (PUT Settings completo com patch de footer)
  const save = async () => {
    const cleanedLinks = (footer.links ?? []).filter(
      (l) => l.label.trim() && l.href.trim()
    );
    const cleanedSocials = (footer.socials ?? []).filter(
      (s) => s.network.trim() && s.href.trim()
    );

    const payload: Settings = {
      ...settings,
      footer: {
        ...stripEmpty(footer),
        links: dedupeByHref(cleanedLinks),
        socials: dedupeByHref(cleanedSocials),
      },
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
        <h1 className="text-xl font-semibold">Footer</h1>
        <p className="text-white/70 text-sm mt-1">
          Edite CNPJ, endereço, links e redes sociais.
        </p>

        {/* CNPJ / Endereço */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-white/80">CNPJ</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/[.06] border border-white/10 p-3"
              value={footer.cnpj ?? ""}
              onChange={(e) => up({ cnpj: e.target.value })}
              placeholder="57.355.709/0001-27"
            />
          </div>
          <div>
            <label className="text-sm text-white/80">Endereço</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/[.06] border border-white/10 p-3"
              value={footer.address ?? ""}
              onChange={(e) => up({ address: e.target.value })}
              placeholder="Rua X, 123 — Cidade/UF"
            />
          </div>
        </div>

        {/* Links */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Links (institucionais)</h2>
            <button
              onClick={addLink}
              className="rounded-lg border border-white/15 bg-white/5 px-3 h-9 text-sm hover:bg-white/10"
            >
              + Adicionar link
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {(footer.links ?? []).map((l, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  className="rounded-xl bg-white/[.06] border border-white/10 p-3"
                  placeholder="Rótulo (ex.: Privacidade)"
                  value={l.label ?? ""}
                  onChange={onLinkChange(i, "label")}
                />
                <input
                  className="rounded-xl bg-white/[.06] border border-white/10 p-3"
                  placeholder="/privacidade ou https://…"
                  value={l.href ?? ""}
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

        {/* Redes sociais */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Redes sociais</h2>
            <button
              onClick={addSocial}
              className="rounded-lg border border-white/15 bg-white/5 px-3 h-9 text-sm hover:bg-white/10"
            >
              + Adicionar rede
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {(footer.socials ?? []).map((s, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  className="rounded-xl bg-white/[.06] border border-white/10 p-3"
                  placeholder="instagram | whatsapp | tiktok"
                  value={s.network ?? ""}
                  onChange={onSocialChange(i, "network")}
                />
                <input
                  className="rounded-xl bg-white/[.06] border border-white/10 p-3"
                  placeholder="https://..."
                  value={s.href ?? ""}
                  onChange={onSocialChange(i, "href")}
                />
                <button
                  onClick={() => removeSocial(i)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 h-12 text-sm hover:bg-white/10"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={save}
            className="rounded-xl bg-primary px-5 h-11 font-semibold hover:opacity-95"
          >
            Salvar
          </button>
        </div>
      </div>
    </section>
  );
}
