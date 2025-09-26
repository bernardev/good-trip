"use client";

import { useState } from "react";

type SubmitResult = "idle" | "submitting" | "success" | "error";

interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  order?: string;
}

interface ApiResponse {
  ok: boolean;
  message?: string;
}

function getStr(fd: FormData, key: keyof ContactPayload): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function isValidEmail(email: string): boolean {
  // validação simples e segura
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ContactForm() {
  const [status, setStatus] = useState<SubmitResult>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setStatus("submitting");
    setErrMsg(null);

    const fd = new FormData(e.currentTarget);

    const payload: ContactPayload = {
      name: getStr(fd, "name"),
      email: getStr(fd, "email"),
      subject: getStr(fd, "subject") || undefined,
      message: getStr(fd, "message"),
      order: getStr(fd, "order") || undefined,
    };

    // validação mínima no client
    if (!payload.name || !payload.email || !payload.message) {
      setStatus("error");
      setErrMsg("Nome, e-mail e mensagem são obrigatórios.");
      return;
    }
    if (!isValidEmail(payload.email)) {
      setStatus("error");
      setErrMsg("Informe um e-mail válido.");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message ?? "Erro ao enviar a mensagem.");
      }

      setStatus("success");
      e.currentTarget.reset();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Falha inesperada ao enviar.";
      setStatus("error");
      setErrMsg(msg);
    }
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-ink/70">Nome*</span>
          <input
            name="name"
            type="text"
            required
            className="mt-1 w-full rounded-xl border border-cloud bg-white px-3 h-11 outline-none focus:ring-2 ring-primary/30"
            placeholder="Seu nome completo"
          />
        </label>
        <label className="block">
          <span className="text-sm text-ink/70">E-mail*</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-cloud bg-white px-3 h-11 outline-none focus:ring-2 ring-primary/30"
            placeholder="voce@email.com"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-ink/70">Assunto</span>
          <input
            name="subject"
            type="text"
            className="mt-1 w-full rounded-xl border border-cloud bg-white px-3 h-11 outline-none focus:ring-2 ring-primary/30"
            placeholder="Dúvida, suporte, reembolso…"
          />
        </label>
        <label className="block">
          <span className="text-sm text-ink/70">Nº do pedido (opcional)</span>
          <input
            name="order"
            type="text"
            className="mt-1 w-full rounded-xl border border-cloud bg-white px-3 h-11 outline-none focus:ring-2 ring-primary/30"
            placeholder="Ex.: GT-123456"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm text-ink/70">Mensagem*</span>
        <textarea
          name="message"
          required
          rows={5}
          className="mt-1 w-full rounded-xl border border-cloud bg-white px-3 py-2 outline-none focus:ring-2 ring-primary/30"
          placeholder="Descreva como podemos ajudar"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-primary text-white px-6 h-11 font-semibold shadow-soft hover:opacity-95 disabled:opacity-60"
        >
          {submitting ? "Enviando..." : "Enviar mensagem"}
        </button>

        {status === "success" && (
          <span className="text-sm text-emerald-600">
            Mensagem enviada! Em breve entraremos em contato.
          </span>
        )}
        {status === "error" && errMsg && (
          <span className="text-sm text-red-600">{errMsg}</span>
        )}
      </div>
    </form>
  );
}
