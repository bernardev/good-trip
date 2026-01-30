// apps/web/src/components/buscar/IdentificacaoConexaoClient.tsx
"use client";

import { useEffect, useState } from "react";
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
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";

type Trecho = {
  servico: string;
  origem: string;
  destino: string;
  data: string;
  assento: string;
  origemNome?: string;
  destinoNome?: string;
};

type Props = {
  trecho1: Trecho;
  trecho2: Trecho;
};

type PassageiroForm = {
  nomeCompleto: string;
  docNumero: string;
  telefone: string;
  email: string;
};

/** ===== Utils ===== */
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function formatViopCity(nome: string): string {
  const cleaned = nome.trim().toUpperCase();
  
  // 🔥 Se já está no formato "CIDADE/UF", retorna formatado
  if (/^[^/]+\/[A-Z]{2}$/.test(cleaned)) {
    const [cidade, estado] = cleaned.split('/');
    const cidadeFormatada = cidade
      .toLowerCase()
      .split(' ')
      .map((word) => 
        ['de', 'do', 'da', 'dos', 'das', 'e'].includes(word) 
          ? word 
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(' ')
      .replace(/\bSao\b/g, 'São');
    
    return `${cidadeFormatada}/${estado}`;
  }
  
  // 🔥 Formato antigo: "CIDADE - UF" ou "CIDADE"
  const stateMatch = cleaned.match(/[A-Z]{2}$/);
  const estado = stateMatch ? stateMatch[0] : '';
  const cidadeMatch = cleaned.match(/^([^-]+)/);
  const cidadeRaw = cidadeMatch ? cidadeMatch[1].trim() : cleaned;
  const cidade = cidadeRaw
    .toLowerCase()
    .split(' ')
    .map((word) => 
      ['de', 'do', 'da', 'dos', 'das', 'e'].includes(word) 
        ? word 
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ')
    .replace(/\bSao\b/g, 'São');
  
  return estado ? `${cidade}/${estado}` : cidade;
}

function formatDatePTBR(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

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
  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  const digits = numbers.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== digits[9]) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== digits[10]) return false;
  
  return true;
}

function maskPhone(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

export default function IdentificacaoConexaoClient({ trecho1, trecho2 }: Props) {
  // 🔥 DEBUG: Ver se os nomes estão chegando
  console.log('🔍 Trecho 1:', trecho1);
  console.log('🔍 Trecho 2:', trecho2);

  const [secsLeft, setSecsLeft] = useState<number>(10 * 60);
  useEffect(() => {
    const id = window.setInterval(() => {
      setSecsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  const mm = Math.floor(secsLeft / 60);
  const ss = secsLeft % 60;

  // 🔥 UM ÚNICO PASSAGEIRO para 2 assentos
  const [passageiro, setPassageiro] = useState<PassageiroForm>({
    nomeCompleto: "",
    docNumero: "",
    telefone: "",
    email: "",
  });

  const [terms, setTerms] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  function setField(key: keyof PassageiroForm, val: string) {
    setPassageiro(prev => ({ ...prev, [key]: val }));
  }

  function getCPFStatus(): 'valid' | 'invalid' | 'empty' {
    if (!passageiro.docNumero.trim()) return 'empty';
    return validateCPF(passageiro.docNumero) ? 'valid' : 'invalid';
  }

  function validate(): string | null {
    if (!passageiro.nomeCompleto.trim()) return 'Preencha o nome completo.';
    if (!passageiro.docNumero.trim()) return 'Informe o CPF.';
    
    const cpfClean = sanitizeCPF(passageiro.docNumero);
    if (cpfClean.length !== 11) return 'CPF deve ter 11 dígitos.';
    if (!validateCPF(passageiro.docNumero)) return 'CPF inválido.';
    
    if (!passageiro.telefone.trim()) return 'Informe o telefone.';
    if (!passageiro.email.trim()) return 'Informe o e-mail.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passageiro.email.trim())) return 'E-mail inválido.';
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
      const passageiroSanitizado = {
        ...passageiro,
        docTipo: 'CPF',
        docNumero: sanitizeCPF(passageiro.docNumero),
        telefone: passageiro.telefone.replace(/\D/g, ''),
      };

      // 🔥 Para conexões: enviar os 2 assentos + flag conexao=true
      // O backend vai detectar e NÃO multiplicar o preço
      const params = new URLSearchParams({
        servico: trecho1.servico,
        origem: trecho1.origem,
        destino: trecho2.destino, // Destino final
        data: trecho1.data,
        assentos: `${trecho1.assento},${trecho2.assento}`, // 🔥 Os 2 assentos
        passageiros: JSON.stringify([passageiroSanitizado]),
        // 🔥 Flag de conexão para o pagamento não duplicar preço
        conexao: 'true',
        servico1: trecho1.servico,
        origem1: trecho1.origem,
        destino1: trecho1.destino,
        assento1: trecho1.assento,
        origemNome1: trecho1.origemNome || '',
        destinoNome1: trecho1.destinoNome || '',
        servico2: trecho2.servico,
        origem2: trecho2.origem,
        destino2: trecho2.destino,
        assento2: trecho2.assento,
        origemNome2: trecho2.origemNome || '',
        destinoNome2: trecho2.destinoNome || '',
      });
      
      window.location.href = `/buscar-viop/pagamento?${params.toString()}`;
    } finally {
      setSubmitting(false);
    }
  }

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
          
          {/* Card: Dados do Passageiro */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
            <header className="bg-gradient-to-r from-blue-600 to-sky-600 px-6 py-4">
              <h2 className="text-lg font-black text-white">Dados do Passageiro</h2>
              <p className="text-sm text-blue-100">Válido para todos os trechos</p>
            </header>

            <div className="p-6 space-y-5">
              <Field
                label="Nome Completo*"
                icon={<User2 className="w-4 h-4" />}
                value={passageiro.nomeCompleto}
                onChange={(v) => setField("nomeCompleto", v)}
              />

              <CPFField
                label="CPF*"
                icon={<Hash className="w-4 h-4" />}
                value={passageiro.docNumero}
                onChange={(v) => setField("docNumero", maskCPF(v))}
                status={getCPFStatus()}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  type="tel"
                  label="Telefone/WhatsApp*"
                  icon={<Phone className="w-4 h-4" />}
                  value={passageiro.telefone}
                  onChange={(v) => setField("telefone", maskPhone(v))}
                  placeholder="(00) 00000-0000"
                />
                <Field
                  type="email"
                  label="E-mail*"
                  icon={<Mail className="w-4 h-4" />}
                  value={passageiro.email}
                  onChange={(v) => setField("email", v)}
                  placeholder="[email protected]"
                  required={true}
                />
              </div>
            </div>
          </div>

          {/* Card: Assentos */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Assentos Selecionados</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black">
                  {trecho1.assento}
                </div>
                <div className="text-sm flex-1">
                  <span className="font-bold text-gray-900">Trecho 1</span>
                  <div className="text-gray-600 mt-0.5">
                    {trecho1.origemNome ? formatViopCity(trecho1.origemNome) : trecho1.origem} → {trecho1.destinoNome ? formatViopCity(trecho1.destinoNome) : trecho1.destino}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                <div className="bg-orange-600 text-white px-4 py-2 rounded-lg font-black">
                  {trecho2.assento}
                </div>
                <div className="text-sm flex-1">
                  <span className="font-bold text-gray-900">Trecho 2</span>
                  <div className="text-gray-600 mt-0.5">
                    {trecho2.origemNome ? formatViopCity(trecho2.origemNome) : trecho2.origem} → {trecho2.destinoNome ? formatViopCity(trecho2.destinoNome) : trecho2.destino}
                  </div>
                </div>
              </div>
            </div>
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
              {/* Badge Conexão */}
              <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <span className="text-sm font-bold text-orange-900">Viagem com Conexão</span>
              </div>

              {/* Trecho 1 */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-bold">TRECHO 1</span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {trecho1.origemNome ? formatViopCity(trecho1.origemNome) : trecho1.origem} → {trecho1.destinoNome ? formatViopCity(trecho1.destinoNome) : trecho1.destino}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-700">{formatDatePTBR(trecho1.data)}</span>
                </div>
              </div>

              {/* Trecho 2 */}
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-bold">TRECHO 2</span>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {trecho2.origemNome ? formatViopCity(trecho2.origemNome) : trecho2.origem} → {trecho2.destinoNome ? formatViopCity(trecho2.destinoNome) : trecho2.destino}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-gray-700">{formatDatePTBR(trecho2.data)}</span>
                </div>
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