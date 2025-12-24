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
  ArrowRight,
} from "lucide-react";

/** ===== Tipos ===== */
type Query = {
  servico: string;
  origem: string;
  destino: string;
  data: string;
  assentos: string[];
};

type Meta = {
  preco?: number;
  empresa?: string;
  classe?: string;
  saida?: string;
  chegada?: string;
  origemNome?: string;
  destinoNome?: string;
};

type Props = { query: Query; meta?: Meta };

type DocTipo = "CPF" | "RG" | "Passaporte";

type PassageiroForm = {
  assento: string;
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

function fmtDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pt-BR", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric" 
  });
}

/** ===== Componente ===== */
export default function IdentificacaoClient({ query, meta }: Props) {
  const [secsLeft, setSecsLeft] = useState<number>(10 * 60);
  useEffect(() => {
    const id = window.setInterval(() => {
      setSecsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  const mm = Math.floor(secsLeft / 60);
  const ss = secsLeft % 60;

  // 🔥 Estado para múltiplos passageiros (um por assento)
  const [passageiros, setPassageiros] = useState<PassageiroForm[]>(
    query.assentos.map(assento => ({
      assento,
      nome: "",
      sobrenome: "",
      docTipo: "CPF" as DocTipo,
      docNumero: "",
      nacionalidade: "Brasil",
      email: "",
      emailConfirm: "",
    }))
  );

  const [terms, setTerms] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const precoSubtotal = useMemo<number | undefined>(() => {
    if (typeof meta?.preco === "number" && query.assentos.length > 0) {
      return meta.preco * query.assentos.length;
    }
    return meta?.preco;
  }, [meta?.preco, query.assentos]);

  // 🔥 Atualizar dados de um passageiro específico
  function setPassageiro(index: number, key: keyof PassageiroForm, val: string | DocTipo) {
    setPassageiros(prev => prev.map((p, i) => 
      i === index ? {...p, [key]: val} : p
    ));
  }

  // 🔥 Validar todos os passageiros
  function validate(): string | null {
    for (let i = 0; i < passageiros.length; i++) {
      const p = passageiros[i];
      if (!p.nome.trim() || !p.sobrenome.trim()) 
        return `Passageiro ${i+1} (Assento ${p.assento}): Preencha nome e sobrenome.`;
      if (!p.docNumero.trim()) 
        return `Passageiro ${i+1} (Assento ${p.assento}): Informe o documento.`;
      if (!p.email.trim() || !p.emailConfirm.trim()) 
        return `Passageiro ${i+1} (Assento ${p.assento}): Informe os e-mails.`;
      if (p.email !== p.emailConfirm) 
        return `Passageiro ${i+1} (Assento ${p.assento}): E-mails não conferem.`;
    }
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
      const params = new URLSearchParams({
        servico: query.servico,
        origem: query.origem,
        destino: query.destino,
        data: query.data,
        assentos: query.assentos.join(","),
        passageiros: JSON.stringify(passageiros), // 🔥 Enviar array de passageiros
        ...(typeof meta?.preco === "number" ? { preco: String(meta.preco) } : {}),
      });
      window.location.href = `/buscar-viop/pagamento?${params.toString()}`;
    } finally {
      setSubmitting(false);
    }
  }

  const origemDisplay = meta?.origemNome || query.origem;
  const destinoDisplay = meta?.destinoNome || query.destino;

  return (
    <section className="p-6 md:p-8">
      {/* Timer */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-400 rounded-xl">
                <Timer className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Sua sessão expira em</p>
                <p className="text-sm text-gray-600">Complete o cadastro para não perder esta oferta</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-2xl font-black text-gray-900 tabular-nums">
                {pad2(mm)}:{pad2(ss)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Esquerda: Formulário */}
        <form onSubmit={onSubmit} className="space-y-6">
          
          {/* 🔥 LOOP: Um card para cada passageiro */}
          {passageiros.map((passageiro, index) => (
            <div key={index} className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
              <header className="bg-gradient-to-r from-blue-600 to-sky-600 px-6 py-4">
                <h2 className="text-lg font-black text-white">Passageiro {index + 1}</h2>
                <p className="text-sm text-blue-100">Assento {passageiro.assento}</p>
              </header>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Nome*"
                    icon={<User2 className="w-4 h-4" />}
                    value={passageiro.nome}
                    onChange={(v) => setPassageiro(index, "nome", v)}
                  />
                  <Field
                    label="Sobrenome*"
                    icon={<User2 className="w-4 h-4" />}
                    value={passageiro.sobrenome}
                    onChange={(v) => setPassageiro(index, "sobrenome", v)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[170px_1fr_170px] gap-4">
                  <Select
                    label="Tipo de documento*"
                    icon={<Hash className="w-4 h-4" />}
                    value={passageiro.docTipo}
                    onChange={(v) => setPassageiro(index, "docTipo", v as DocTipo)}
                    options={[
                      { label: "CPF", value: "CPF" },
                      { label: "RG", value: "RG" },
                      { label: "Passaporte", value: "Passaporte" },
                    ]}
                  />
                  <Field
                    label="Número do documento*"
                    icon={<Hash className="w-4 h-4" />}
                    value={passageiro.docNumero}
                    onChange={(v) => setPassageiro(index, "docNumero", v)}
                  />
                  <Field
                    label="Cidadania*"
                    icon={<ShieldCheck className="w-4 h-4" />}
                    value={passageiro.nacionalidade}
                    onChange={(v) => setPassageiro(index, "nacionalidade", v)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    type="email"
                    label="E-mail*"
                    icon={<Mail className="w-4 h-4" />}
                    value={passageiro.email}
                    onChange={(v) => setPassageiro(index, "email", v)}
                  />
                  <Field
                    type="email"
                    label="Confirmar e-mail*"
                    icon={<Mail className="w-4 h-4" />}
                    value={passageiro.emailConfirm}
                    onChange={(v) => setPassageiro(index, "emailConfirm", v)}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Card: Assentos */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Assentos Selecionados</h3>
            </div>
            {query.assentos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {query.assentos.map((assento) => (
                  <div key={assento} className="bg-gradient-to-br from-blue-600 to-sky-600 text-white px-4 py-2 rounded-xl font-black">
                    {assento}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <AlertCircle className="w-4 h-4" />
                <span>Nenhum assento selecionado</span>
              </div>
            )}
          </div>

          {/* Card: Termos + Enviar */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />
              <span>
                Reconheço e aceito os <a className="underline font-semibold" href="#">Termos e condições</a> e confirmo
                que o resumo da minha reserva está correto.
              </span>
            </label>

            {erro && (
              <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !terms}
              className="mt-6 w-full relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="relative bg-gradient-to-r from-blue-600 via-sky-600 to-blue-600 text-white font-black py-4 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-blue-500/50 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? "Processando..." : "Continuar para Pagamento"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </form>

        {/* Direita: Resumo Sticky */}
        <aside className="lg:sticky lg:top-6 h-fit">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <header className="bg-gradient-to-r from-blue-600 to-sky-600 px-6 py-4">
              <h2 className="text-lg font-black text-white">Resumo da Viagem</h2>
            </header>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm font-bold">Rota</span>
                </div>
                <p className="font-black text-gray-900 text-lg">
                  {origemDisplay} → {destinoDisplay}
                </p>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">{fmtDate(query.data)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-200">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Saída</p>
                  <p className="font-black text-gray-900">{meta?.saida ?? "--:--"}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Chegada</p>
                  <p className="font-black text-gray-900">{meta?.chegada ?? "--:--"}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Classe</p>
                  <p className="font-black text-gray-900">{meta?.classe ?? "—"}</p>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-gray-200" />

              <div className="space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Passageiros</span>
                  <span className="font-semibold">{Math.max(1, query.assentos.length)}</span>
                </div>
                {typeof meta?.preco === "number" && (
                  <>
                    <div className="flex justify-between text-gray-700">
                      <span>Preço por passageiro</span>
                      <span className="font-semibold">{fmtBRL(meta.preco)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-blue-600">
                      <span>Total</span>
                      <span>{fmtBRL(precoSubtotal ?? meta.preco)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <span className="text-xs text-green-800 font-semibold">
                  Compra 100% segura e protegida
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

/** ===== Subcomponentes ===== */
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
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon}
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-600 focus:outline-none transition-colors"
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
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon}
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-600 focus:outline-none transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}