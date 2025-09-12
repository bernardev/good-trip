type Props = { searchParams?: Record<string, string | string[] | undefined> };

export default function Buscar({ searchParams }: Props) {
  const q = searchParams ?? {};
  const get = (k: string) => (Array.isArray(q[k]) ? q[k]?.[0] : q[k]) ?? "";

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-10">
      <h1 className="text-2xl font-semibold text-navy">Resultados</h1>
      <p className="text-ink/70">Resumo da sua busca de ônibus.</p>

      <div className="mt-6 rounded-2xl border border-cloud bg-white p-5 shadow-soft">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><dt className="text-ink/60">Origem</dt><dd className="font-medium">{get("from")}</dd></div>
          <div><dt className="text-ink/60">Destino</dt><dd className="font-medium">{get("to")}</dd></div>
          <div><dt className="text-ink/60">Data de ida</dt><dd className="font-medium">{get("date")}</dd></div>
          {get("return") && <div><dt className="text-ink/60">Data de volta</dt><dd className="font-medium">{get("return")}</dd></div>}
          <div><dt className="text-ink/60">Passageiros</dt><dd className="font-medium">{get("pax") || "1"}</dd></div>
        </dl>

        <p className="mt-4 text-ink/60 text-sm">
          Integração com Distribusion entra aqui (listagem, filtros, etc).
        </p>
      </div>
    </div>
  );
}
