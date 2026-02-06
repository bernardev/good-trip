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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Bilhetes</h1>
            <p className="text-sm text-gray-600 mt-1">
              {bilhetes.length} bilhete(s) encontrado(s)
            </p>
          </div>

          <button
            onClick={carregarBilhetes}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Mensagem */}
        {mensagem && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
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
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Carregando...</span>
          </div>
        )}

        {/* Vazio */}
        {!loading && bilhetes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-600">Nenhum bilhete encontrado.</p>
          </div>
        )}

        {/* Tabela Compacta */}
        {!loading && bilhetes.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase">
                    Passageiro
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase">
                    Telefone
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase">
                    Viagem
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase">
                    Data
                  </th>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 uppercase">
                    Ass.
                  </th>
                  <th className="px-2 py-2 text-right font-medium text-gray-600 uppercase">
                    Valor
                  </th>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bilhetes.map((bilhete) => (
                  <tr key={bilhete.orderId} className="hover:bg-gray-50">
                    {/* Passageiro */}
                    <td className="px-2 py-2">
                      <div className="max-w-[150px]">
                        <div className="font-medium text-gray-900 truncate" title={bilhete.passageiroNome}>
                          {bilhete.passageiroNome}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {bilhete.localizador}
                        </div>
                      </div>
                    </td>

                    {/* Telefone */}
                    <td className="px-2 py-2">
                      <div className="text-gray-900">
                        {bilhete.telefone}
                      </div>
                    </td>

                    {/* Viagem */}
                    <td className="px-2 py-2">
                      <div className="max-w-[180px]">
                        <div className="text-gray-900 truncate" title={`${bilhete.origem} → ${bilhete.destino}`}>
                          {bilhete.origem.split('-')[0].trim()} → {bilhete.destino.split('-')[0].trim()}
                        </div>
                      </div>
                    </td>

                    {/* Data */}
                    <td className="px-2 py-2 text-gray-900">
                      {bilhete.data}
                    </td>

                    {/* Assentos */}
                    <td className="px-2 py-2 text-center text-gray-900">
                      {bilhete.assentos.join(', ')}
                    </td>

                    {/* Valor */}
                    <td className="px-2 py-2 text-right font-medium text-gray-900">
                      R$ {bilhete.valor.toFixed(2)}
                    </td>

                    {/* Ações */}
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {/* Email */}
                        <button
                          onClick={() => reenviarEmail(bilhete.orderId, bilhete.passageiroNome)}
                          disabled={enviandoEmail === bilhete.orderId}
                          className="p-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          title="Email Admin"
                        >
                          {enviandoEmail === bilhete.orderId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Mail className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* WhatsApp */}
                        <button
                          onClick={() =>
                            reenviarWhatsApp(bilhete.orderId, bilhete.telefone, bilhete.passageiroNome)
                          }
                          disabled={enviandoWhatsApp === bilhete.orderId}
                          className="p-1.5 border border-green-300 rounded text-green-700 hover:bg-green-50 disabled:opacity-50"
                          title="WhatsApp Cliente"
                        >
                          {enviandoWhatsApp === bilhete.orderId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MessageCircle className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}