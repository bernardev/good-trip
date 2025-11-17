"use client";

import { useState, useEffect } from "react";

export type Poltrona = { numero: string; livre: boolean; classe?: string };

type Props = {
  poltronas: Poltrona[];
  maxSelect?: number; // opcional (ex.: 5)
  onChange?(selected: string[]): void;
};

export default function SeatGrid({ poltronas, maxSelect, onChange }: Props) {
  const [selecionados, setSelecionados] = useState<string[]>([]);

  useEffect(() => {
    onChange?.(selecionados);
  }, [selecionados, onChange]);

  function toggle(numero: string, livre: boolean) {
    if (!livre) return;
    setSelecionados((prev) => {
      const exists = prev.includes(numero);
      if (exists) return prev.filter((n) => n !== numero);
      if (maxSelect && prev.length >= maxSelect) return prev; // trava limite
      return [...prev, numero];
    });
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {poltronas.map((p) => {
          const active = selecionados.includes(p.numero);
          return (
            <button
              key={p.numero}
              type="button"
              disabled={!p.livre}
              onClick={() => toggle(p.numero, p.livre)}
              title={p.classe ?? ""}
              className={[
                "h-12 rounded-lg border text-sm transition",
                p.livre
                  ? "bg-white hover:bg-slate-50"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed",
                active ? "ring-2 ring-blue-600 border-blue-600" : "",
              ].join(" ")}
            >
              {p.numero}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-sm">
        Selecionados: <strong>{selecionados.length}</strong>
        {selecionados.length > 0 && (
          <span className="ml-2 text-slate-600">({selecionados.join(", ")})</span>
        )}
      </div>
    </>
  );
}
