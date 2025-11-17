"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  CreditCard,
  Hash,
  Mail,
  MapPin,
  ShieldCheck,
  Timer,
  User2,
  Ticket,
} from "lucide-react";

/** ===== Tipos ===== */
type Query = {
  servico: string;
  origem: string;     // ID da origem (ex: 3603)
  destino: string;    // ID do destino (ex: 10089)
  data: string;       // YYYY-MM-DD
  assentos: string[]; // ["02","04",...]
};

type Meta = {
  preco?: number;
  empresa?: string;
  classe?: string;
  saida?: string;     // HH:mm
  chegada?: string;   // HH:mm
};

type Props = { query: Query; meta?: Meta };

type DocTipo = "CPF" | "RG" | "Passaporte";
type PassageiroForm = {
  nome: string;
  sobrenome: string;
  docTipo: DocTipo;
  docNumero: string;
  nacionalidade: string;
  email: string;
  emailConfirm: string;
};

/** ===== Utils ===== */
const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** ===== Componente ===== */
export default function IdentificacaoClient({ query, meta }: Props) {
  // timer (40 min)
  const [secsLeft, setSecsLeft] = useState<number>(40 * 60);
  useEffect(() => {
    const id = window.setInterval(() => {
      setSecsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  const mm = Math.floor(secsLeft / 60);
  const ss = secsLeft % 60;

  const [form, setForm] = useState<PassageiroForm>({
    nome: "",
    sobrenome: "",
    docTipo: "CPF",
    docNumero: "",
    nacionalidade: "Brasil",
    email: "",
    emailConfirm: "",
  });
  const [terms, setTerms] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const precoSubtotal = useMemo<number | undefined>(() => {
    if (typeof meta?.preco === "number" && query.assentos.length > 0) {
      return meta.preco * query.assentos.length;
    }
    return meta?.preco;
  }, [meta?.preco, query.assentos]);

  function set<K extends keyof PassageiroForm>(key: K, val: PassageiroForm[K]) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  function validate(): string | null {
    if (!form.nome.trim() || !form.sobrenome.trim()) return "Preencha nome e sobrenome.";
    if (!form.docNumero.trim()) return "Informe o número do documento.";
    if (!form.email.trim() || !form.emailConfirm.trim()) return "Informe e confirme o e-mail.";
    if (form.email !== form.emailConfirm) return "Os e-mails não conferem.";
    if (!terms) return "Aceite os Termos e Condições para continuar.";
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setErro(v);
      return;
    }
    setErro(null);
    setSubmitting(true);

    try {
      // mantém o fluxo por querystring para a etapa de pagamento
      const params = new URLSearchParams({
        servico: query.servico,
        origem: query.origem,
        destino: query.destino,
        data: query.data,
        assentos: query.assentos.join(","),
        nome: form.nome,
        sobrenome: form.sobrenome,
        docTipo: form.docTipo,
        docNumero: form.docNumero,
        nacionalidade: form.nacionalidade,
        email: form.email,
        // preço unitário opcional para compor o resumo no pagamento
        ...(typeof meta?.preco === "number" ? { preco: String(meta.preco) } : {}),
      });
      window.location.href = `/buscar-viop/pagamento?${params.toString()}`;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative isolate">
      {/* ornaments (coerentes com o Hero) */}
      <div className="fx-orb fx-orb--gold w-80 h-80 -left-24 -top-24 opacity-60 -z-10" />
      <div className="fx-orb fx-orb--blue w-96 h-96 -right-28 -bottom-28 opacity-60 -z-10" />
      <div className="fx-stars -z-10" />
      <div className="fx-grain -z-10" />

      {/* topo: aviso + timer */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 mb-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-800 glass">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5" />
            <p className="text-sm">
              <strong>Economize agora:</strong> tarifas dinâmicas podem subir a qualquer momento.
            </p>
          </div>
        </div>
        <div className="rounded-2xl gb p-[2px]">
          <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <Timer className="w-4 h-4" />
              <span className="text-sm">Sua sessão expira em</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold tabular-nums">
                {pad2(mm)}:{pad2(ss)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* esquerda: formulário */}
        <form onSubmit={onSubmit} className="space-y-6">
          {/* card: passageiro */}
          <div className="gb p-[2px] rounded-2xl">
            <div className="glass rounded-2xl border border-cloud/70 shadow-soft">
              <header className="px-6 py-5 border-b border-cloud/70">
                <h2 className="text-base font-semibold">Detalhes do passageiro</h2>
                <p className="text-xs text-slate-500">Passageiro 1</p>
              </header>

              <div className="px-6 py-6 grid gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Nome*"
                    icon={<User2 className="w-4 h-4" />}
                    value={form.nome}
                    onChange={(v) => set("nome", v)}
                  />
                  <Field
                    label="Sobrenome*"
                    icon={<User2 className="w-4 h-4" />}
                    value={form.sobrenome}
                    onChange={(v) => set("sobrenome", v)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[170px_1fr_170px] gap-4">
                  <Select
                    label="Tipo de documento*"
                    icon={<Hash className="w-4 h-4" />}
                    value={form.docTipo}
                    onChange={(v) => set("docTipo", v as DocTipo)}
                    options={[
                      { label: "CPF", value: "CPF" },
                      { label: "RG", value: "RG" },
                      { label: "Passaporte", value: "Passaporte" },
                    ]}
                  />
                  <Field
                    label="Número do documento*"
                    icon={<Hash className="w-4 h-4" />}
                    value={form.docNumero}
                    onChange={(v) => set("docNumero", v)}
                  />
                  <Field
                    label="Cidadania*"
                    icon={<ShieldCheck className="w-4 h-4" />}
                    value={form.nacionalidade}
                    onChange={(v) => set("nacionalidade", v)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    type="email"
                    label="E-mail*"
                    icon={<Mail className="w-4 h-4" />}
                    value={form.email}
                    onChange={(v) => set("email", v)}
                  />
                  <Field
                    type="email"
                    label="Confirmar e-mail*"
                    icon={<Mail className="w-4 h-4" />}
                    value={form.emailConfirm}
                    onChange={(v) => set("emailConfirm", v)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* card: assentos */}
          <div className="gb p-[2px] rounded-2xl">
            <div className="glass rounded-2xl border border-cloud/70 shadow-soft">
              <header className="px-6 py-5 border-b border-cloud/70">
                <h2 className="text-base font-semibold">Seleção de assento</h2>
                <p className="text-xs text-slate-500">Viagem de ida</p>
              </header>
              <div className="px-6 py-5 text-sm">
                {query.assentos.length > 0 ? (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Ticket className="w-4 h-4 text-slate-500" />
                    {query.assentos.length === 1 ? (
                      <span>1 assento selecionado: <strong>{query.assentos[0]}</strong></span>
                    ) : (
                      <span>
                        {query.assentos.length} assentos selecionados:{" "}
                        <strong>{query.assentos.join(", ")}</strong>
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500">
                    <AlertCircle className="w-4 h-4" />
                    <span>Nenhum assento selecionado.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* card: termos + enviar */}
          <div className="gb p-[2px] rounded-2xl">
            <div className="glass rounded-2xl border border-cloud/70 shadow-soft p-6">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                />
                <span>
                  Reconheço e aceito os <a className="underline" href="#">Termos e condições</a> e quaisquer condições
                  especiais aplicáveis à minha reserva. Confirmo que o resumo da minha reserva está correto.
                </span>
              </label>

              {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

              <button
                type="submit"
                disabled={submitting || !terms}
                className="mt-4 w-full rounded-2xl bg-primary text-white font-semibold py-3 shadow-soft hover:opacity-95 transition disabled:opacity-60"
              >
                {submitting ? "Processando..." : "Continuar para pagamento"}
              </button>
            </div>
          </div>
        </form>

        {/* direita: resumo sticky */}
        <aside className="lg:sticky lg:top-6 h-fit space-y-6">
          <div className="gb p-[2px] rounded-2xl">
            <div className="glass rounded-2xl border border-cloud/70 shadow-soft">
              <header className="px-6 py-5 border-b border-cloud/70">
                <h2 className="text-base font-semibold">Detalhes da reserva</h2>
              </header>

              <div className="px-6 py-5 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">
                    {query.origem} → {query.destino}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{query.data}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center border rounded-xl p-3">
                  <div>
                    <p className="text-xs text-slate-500">Saída</p>
                    <p className="font-semibold">{meta?.saida ?? "--:--"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Chegada</p>
                    <p className="font-semibold">{meta?.chegada ?? "--:--"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Classe</p>
                    <p className="font-semibold">{meta?.classe ?? "—"}</p>
                  </div>
                </div>

                <div className="pt-3 border-t space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Passageiros</span>
                    <span>{Math.max(1, query.assentos.length)}</span>
                  </div>
                  {typeof meta?.preco === "number" && (
                    <>
                      <div className="flex justify-between text-slate-700">
                        <span>Preço unitário</span>
                        <span>{fmtBRL(meta.preco)}</span>
                      </div>
                      <div className="flex justify-between text-base font-semibold">
                        <span>Total</span>
                        <span>{fmtBRL(precoSubtotal ?? meta.preco)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs">Compra segura — criptografia e proteção antifraude.</span>
                </div>
              </div>
            </div>
          </div>

          {/* selo/nota */}
          <div className="glass rounded-2xl border border-cloud/70 shadow-soft px-4 py-3 flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-slate-600" />
            <p className="text-xs text-slate-600">
              O pagamento será finalizado no Checkout Pro (Mercado Pago).
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

/** ===== Subcomponentes de UI (tipados) ===== */

function Field({
  label,
  icon,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email";
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-sm text-slate-700">{icon}{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-cloud/70 bg-white/70 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
        required
      />
    </label>
  );
}

function Select<T extends string>({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string;
  icon?: React.ReactNode;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ label: string; value: T }>;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-sm text-slate-700">{icon}{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-xl border border-cloud/70 bg-white/70 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}
