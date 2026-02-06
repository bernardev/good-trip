'use client';

import { useState, useEffect } from 'react';
import { Loader2, Mail, MessageCircle, RefreshCw } from 'lucide-react';

type Bilhete = {
  orderId: string;
  localizador: string;
  numeroBilhete: string;
  passageiroNome: string;
  telefone: string;
  email: string;
  origem: string;
  destino: string;
  data: string;
  dataEmissao: string;
  assentos: string[];
  valor: number;
};

export default function GestãoBilhetesPage() {
  const [bilhetes, setBilhetes] = useState<Bilhete[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviandoEmail, setEnviandoEmail] = useState<string | null>(null);
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Carregar bilhetes
  const carregarBilhetes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/listar-bilhetes');
      const data = await response.json();

      if (data.success) {
        setBilhetes(data.bilhetes);
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao carregar bilhetes' });
      }
    } catch (error) {
      console.error('Erro ao carregar bilhetes:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar bilhetes' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarBilhetes();
  }, []);

  // Reenviar email
  const reenviarEmail = async (orderId: string, passageiroNome: string) => {
    try {
      setEnviandoEmail(orderId);
      setMensagem(null);

      const response = await fetch('/api/viop/reenviar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (data.success) {
        setMensagem({
          tipo: 'sucesso',
          texto: `Email reenviado com sucesso para ${passageiroNome}!`,
        });
      } else {
        setMensagem({
          tipo: 'erro',
          texto: data.error || 'Erro ao reenviar email',
        });
      }
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao reenviar email' });
    } finally {
      setEnviandoEmail(null);
    }
  };

  // Reenviar WhatsApp
  const reenviarWhatsApp = async (orderId: string, telefone: string, passageiroNome: string) => {
    try {
      setEnviandoWhatsApp(orderId);
      setMensagem(null);

      const response = await fetch('/api/viop/reenviar-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, telefone }),
      });

      const data = await response.json();

      if (data.success) {
        setMensagem({
          tipo: 'sucesso',
          texto: `WhatsApp reenviado com sucesso para ${passageiroNome}!`,
        });
      } else {
        setMensagem({
          tipo: 'erro',
          texto: data.error || 'Erro ao reenviar WhatsApp',
        });
      }
    } catch (error) {
      console.error('Erro ao reenviar WhatsApp:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao reenviar WhatsApp' });
    } finally {
      setEnviandoWhatsApp(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Bilhetes</h1>
            <p className="text-gray-600 mt-1">
              {bilhetes.length} bilhete(s) encontrado(s) no sistema
            </p>
          </div>

          <button
            onClick={carregarBilhetes}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Mensagem de feedback */}
        {mensagem && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              mensagem.tipo === 'sucesso'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando bilhetes...</span>
          </div>
        )}

        {/* Vazio */}
        {!loading && bilhetes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">Nenhum bilhete encontrado no sistema.</p>
          </div>
        )}

        {/* Tabela */}
        {!loading && bilhetes.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Passageiro
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Contato
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Viagem
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Assentos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bilhetes.map((bilhete) => (
                    <tr key={bilhete.orderId} className="hover:bg-gray-50 transition-colors">
                      {/* Passageiro */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                            {bilhete.passageiroNome}
                          </span>
                          <span className="text-xs text-gray-500 mt-0.5">
                            {bilhete.localizador}
                          </span>
                        </div>
                      </td>

                      {/* Contato */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900 whitespace-nowrap">
                            {bilhete.telefone}
                          </span>
                          <span className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]" title={bilhete.email}>
                            {bilhete.email}
                          </span>
                        </div>
                      </td>

                      {/* Viagem */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-900 whitespace-nowrap">
                          {bilhete.origem} → {bilhete.destino}
                        </span>
                      </td>

                      {/* Data */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-900 whitespace-nowrap">
                          {bilhete.data}
                        </span>
                      </td>

                      {/* Assentos */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-900 whitespace-nowrap">
                          {bilhete.assentos.join(', ')}
                        </span>
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                          R$ {bilhete.valor.toFixed(2)}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Botão Email */}
                          <button
                            onClick={() => reenviarEmail(bilhete.orderId, bilhete.passageiroNome)}
                            disabled={enviandoEmail === bilhete.orderId}
                            className="inline-flex items-center justify-center w-9 h-9 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Reenviar email para admin"
                          >
                            {enviandoEmail === bilhete.orderId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </button>

                          {/* Botão WhatsApp */}
                          <button
                            onClick={() =>
                              reenviarWhatsApp(
                                bilhete.orderId,
                                bilhete.telefone,
                                bilhete.passageiroNome
                              )
                            }
                            disabled={enviandoWhatsApp === bilhete.orderId}
                            className="inline-flex items-center justify-center w-9 h-9 border border-green-300 rounded-md text-green-700 bg-white hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Reenviar WhatsApp para cliente"
                          >
                            {enviandoWhatsApp === bilhete.orderId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MessageCircle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}