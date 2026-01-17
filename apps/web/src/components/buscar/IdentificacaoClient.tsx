// apps/web/src/app/components/buscar/IdentificacaoClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Hash,
  Mail,
  MapPin,
  ShieldCheck,
  Timer,
  User2,
  Ticket,
  ArrowRight,
  Phone,
  Clock,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getObservacaoRota, getCorObservacao } from '@/lib/observacoes-rotas';

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

type PassageiroForm = {
  assento: string;
  nomeCompleto: string;
  docNumero: string;
  nacionalidade: string;
  telefone: string;
  email: string;
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

function fmtTime(isoOrHm?: string | null): string {
  if (!isoOrHm) return "--:--";
  const d = new Date(isoOrHm);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return isoOrHm;
}

// 🔥 NOVO: Funções de CPF
function sanitizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function maskCPF(value: string): string {
  const numbers = sanitizeCPF(value);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

function validateCPF(cpf: string): boolean {
  const numbers = sanitizeCPF(cpf);
  
  // CPF deve ter exatamente 11 dígitos
  if (numbers.length !== 11) return false;
  
  // Rejeitar CPFs com todos dígitos iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validar dígitos verificadores
  const digits = numbers.split('').map(Number);
  
  // Validar primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== digits[9]) return false;
  
  // Validar segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== digits[10]) return false;
  
  return true;
}

// 🔥 NOVO: Máscara de telefone
function maskPhone(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
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

  // Estado para múltiplos passageiros
const [passageiros, setPassageiros] = useState<PassageiroForm[]>(
  query.assentos.map(assento => ({
    assento,
    nomeCompleto: "",
    docNumero: "",
    nacionalidade: "Brasil",
    telefone: "",
    email: "",
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

  // Atualizar dados de um passageiro específico
  function setPassageiro(index: number, key: keyof PassageiroForm, val: string) {
    setPassageiros(prev => prev.map((p, i) => 
      i === index ? {...p, [key]: val} : p
    ));
  }

  // 🔥 NOVO: Validar CPF de um passageiro específico
  function getCPFStatus(index: number): 'valid' | 'invalid' | 'empty' {
    const p = passageiros[index];
    if (!p.docNumero.trim()) return 'empty';
    return validateCPF(p.docNumero) ? 'valid' : 'invalid';
  }

  // Validar todos os passageiros
  function validate(): string | null {
    for (let i = 0; i < passageiros.length; i++) {
      const p = passageiros[i];
      if (!p.nomeCompleto.trim()) 
        return `Passageiro ${i+1} (Assento ${p.assento}): Preencha o nome completo.`;
      if (!p.docNumero.trim()) 
        return `Passageiro ${i+1} (Assento ${p.assento}): Informe o documento.`;
      
      // 🔥 Validação específica de CPF
      const cpfClean = sanitizeCPF(p.docNumero);
      if (cpfClean.length !== 11) {
        return `Passageiro ${i+1} (Assento ${p.assento}): CPF deve ter 11 dígitos.`;
      }
      if (!validateCPF(p.docNumero)) {
        return `Passageiro ${i+1} (Assento ${p.assento}): CPF inválido.`;
      }
      
      if (!p.telefone.trim()) 
        return `Passageiro ${i+1} (Assento ${p.assento}): Informe o telefone.`;
      if (!p.email.trim()) 
        return `Passageiro ${i+1} (Assento ${p.assento}): Informe o e-mail.`;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) 
        return `Passageiro ${i+1} (Assento ${p.assento}): E-mail inválido.`;
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
      // 🔥 Sanitizar CPF antes de enviar
    const passageirosSanitizados = passageiros.map(p => ({
      ...p,
      docTipo: 'CPF', // Sempre CPF
      docNumero: sanitizeCPF(p.docNumero),
      telefone: p.telefone.replace(/\D/g, ''),
    }));

      const params = new URLSearchParams({
        servico: query.servico,
        origem: query.origem,
        destino: query.destino,
        data: query.data,
        assentos: query.assentos.join(","),
        passageiros: JSON.stringify(passageirosSanitizados),
        ...(typeof meta?.preco === "number" ? { preco: String(meta.preco) } : {}),
      });
      window.location.href = `/buscar-viop/pagamento?${params.toString()}`;
    } finally {
      setSubmitting(false);
    }
  }

  const origemDisplay = meta?.origemNome || query.origem;
  const destinoDisplay = meta?.destinoNome || query.destino;

  const observacao = getObservacaoRota(
    origemDisplay,
    destinoDisplay,
    meta?.saida || ''
  );

  return (
    <section className="p-6 md:p-8">
      {/* Timer */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-400 rounded-xl flex-shrink-0">
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
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
        {/* Esquerda: Formulário */}
        <form onSubmit={onSubmit} className="space-y-6">
          
          {/* Loop: Um card para cada passageiro */}
{passageiros.map((passageiro, index) => (
  <div key={index} className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
    <header className="bg-gradient-to-r from-blue-600 to-sky-600 px-6 py-4">
      <h2 className="text-lg font-black text-white">Passageiro {index + 1}</h2>
      <p className="text-sm text-blue-100">Assento {passageiro.assento}</p>
    </header>

    <div className="p-6 space-y-5">
      {/* Nome Completo */}
      <div>
        <Field
          label="Nome Completo*"
          icon={<User2 className="w-4 h-4" />}
          value={passageiro.nomeCompleto}
          onChange={(v) => setPassageiro(index, "nomeCompleto", v)}
        />
      </div>

      {/* CPF */}
      <div>
        <CPFField
          label="CPF*"
          icon={<Hash className="w-4 h-4" />}
          value={passageiro.docNumero}
          onChange={(v) => setPassageiro(index, "docNumero", maskCPF(v))}
          status={getCPFStatus(index)}
        />
      </div>
      {/* Contato - Grid 2 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          type="tel"
          label="Telefone/WhatsApp*"
          icon={<Phone className="w-4 h-4" />}
          value={passageiro.telefone}
          onChange={(v) => setPassageiro(index, "telefone", maskPhone(v))}
          placeholder="(00) 00000-0000"
        />
        <Field
          type="email"
          label="E-mail*"
          icon={<Mail className="w-4 h-4" />}
          value={passageiro.email}
          onChange={(v) => setPassageiro(index, "email", v)}
          placeholder="[email protected]"
          required={true}
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
            <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded cursor-pointer"
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
        <aside className="xl:sticky xl:top-6 h-fit">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <header className="bg-gradient-to-r from-blue-600 to-sky-600 px-6 py-4">
              <h2 className="text-lg font-black text-white">Resumo da Viagem</h2>
            </header>

            <div className="p-6 space-y-4">
              {/* Rota */}
              <div>
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm font-bold">Rota</span>
                </div>
                <p className="font-black text-gray-900 text-base leading-tight">
                  {origemDisplay} → {destinoDisplay}
                </p>
              </div>

              {/* Data */}
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-sm">{fmtDate(query.data)}</span>
              </div>

              {/* Observação da rota */}
              {observacao && (
                <div className={`px-3 py-2 rounded-lg border flex items-start gap-2 ${getCorObservacao(observacao.tipo)}`}>
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="text-xs leading-tight">
                    <div className="font-bold">Atenção!</div>
                    <div>{observacao.icone} {observacao.texto}</div>
                  </div>
                </div>
              )}

              {/* Grid Horários */}
              <div className="grid grid-cols-3 gap-2 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3 border border-blue-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <p className="text-xs text-gray-600 font-semibold">Saída</p>
                  </div>
                  <p className="font-black text-gray-900 text-sm">{fmtTime(meta?.saida)}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <p className="text-xs text-gray-600 font-semibold">Chegada</p>
                  </div>
                  <p className="font-black text-gray-900 text-sm">{fmtTime(meta?.chegada)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 font-semibold mb-1">Classe</p>
                  <p className="font-black text-gray-900 text-xs">{meta?.classe ?? "—"}</p>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-gray-200" />

              {/* Valores */}
              <div className="space-y-2">
                <div className="flex justify-between text-gray-700 text-sm">
                  <span>Passageiros</span>
                  <span className="font-semibold">{Math.max(1, query.assentos.length)}</span>
                </div>
                {typeof meta?.preco === "number" && (
                  <>
                    <div className="flex justify-between text-gray-700 text-sm">
                      <span>Preço/passageiro</span>
                      <span className="font-semibold">{fmtBRL(meta.preco)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-blue-600">
                      <span>Total</span>
                      <span>{fmtBRL(precoSubtotal ?? meta.preco)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Badge Segurança */}
              <div className="bg-green-50 border-2 border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-xs text-green-800 font-semibold leading-tight">
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
  placeholder,
  required = true,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "tel";
  placeholder?: string;
  required?: boolean;
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
        placeholder={placeholder}
        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-600 focus:outline-none transition-colors"
        required={required}
      />
    </label>
  );
}

// 🔥 NOVO: Campo CPF com validação visual
function CPFField({
  label,
  icon,
  value,
  onChange,
  status,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  status: 'valid' | 'invalid' | 'empty';
}) {
  const borderColor = 
    status === 'valid' ? 'border-green-500' :
    status === 'invalid' ? 'border-red-500' :
    'border-gray-200';
    
  const iconColor =
    status === 'valid' ? 'text-green-600' :
    status === 'invalid' ? 'text-red-600' :
    'text-gray-400';

  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon}
        {label}
      </span>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="000.000.000-00"
          maxLength={14}
          className={`w-full rounded-xl border-2 ${borderColor} bg-white px-4 py-3 pr-10 text-sm focus:border-blue-600 focus:outline-none transition-colors`}
          required
        />
        {status !== 'empty' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {status === 'valid' ? (
              <CheckCircle2 className={`w-5 h-5 ${iconColor}`} />
            ) : (
              <XCircle className={`w-5 h-5 ${iconColor}`} />
            )}
          </div>
        )}
      </div>
      {status === 'invalid' && (
        <p className="mt-1 text-xs text-red-600 font-medium">CPF inválido</p>
      )}
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