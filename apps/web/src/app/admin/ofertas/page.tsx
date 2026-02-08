'use client';

import { useState, useEffect } from 'react';
import { ViopCitiesResponse } from '@/types/unified-trip';

type Oferta = {
  id: string;
  origem: string;
  destino: string;
  origemId: string;
  destinoId: string;
  valor: number;
  ativo: boolean;
  ordem: number;
};

type CityOption = {
  nome: string;
  id: string;
};

export default function GestaoOfertasPage() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscandoPreco, setBuscandoPreco] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [origemId, setOrigemId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [origemTerm, setOrigemTerm] = useState('');
  const [destinoTerm, setDestinoTerm] = useState('');
  const [allOrigins, setAllOrigins] = useState<CityOption[]>([]);
  const [allDestinations, setAllDestinations] = useState<CityOption[]>([]);
  const [origemSuggestions, setOrigemSuggestions] = useState<CityOption[]>([]);
  const [destinoSuggestions, setDestinoSuggestions] = useState<CityOption[]>([]);
  const [showOrigemDropdown, setShowOrigemDropdown] = useState(false);
  const [showDestinoDropdown, setShowDestinoDropdown] = useState(false);
  const [valorEncontrado, setValorEncontrado] = useState<number | null>(null);

  const formatViopCity = (nome: string): string => {
    const cleaned = nome.trim().toUpperCase();
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
    
    return estado ? `${cidade}, ${estado}` : cidade;
  };

  const normalizeForSearch = (text: string): string => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  const carregarOfertas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ofertas');
      const data = await response.json();
      if (data.success) setOfertas(data.ofertas);
    } catch (error) {
      console.error('Erro ao carregar ofertas:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar ofertas' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOfertas();
  }, []);

  useEffect(() => {
    const fetchAllOrigins = async () => {
      try {
        const response = await fetch('/api/viop/origens?q=');
        const data: ViopCitiesResponse = await response.json();
        
        if (data.ok && data.items) {
          const formatted = data.items.map(city => ({
            id: city.id,
            nome: formatViopCity(city.nome)
          }));
          setAllOrigins(formatted);
        }
      } catch (error) {
        console.error('Erro ao buscar origens:', error);
      }
    };

    fetchAllOrigins();
  }, []);

  useEffect(() => {
    if (allOrigins.length === 0) return;

    if (!origemTerm || origemTerm.trim() === '') {
      setOrigemSuggestions(allOrigins.slice(0, 10));
    } else {
      const normalized = normalizeForSearch(origemTerm);
      const filtered = allOrigins.filter(city => 
        normalizeForSearch(city.nome).includes(normalized)
      );
      setOrigemSuggestions(filtered.slice(0, 10));
    }
  }, [origemTerm, allOrigins]);

  useEffect(() => {
    if (!origemId) {
      setAllDestinations([]);
      setDestinoSuggestions([]);
      return;
    }

    const fetchDestinations = async () => {
      try {
        const response = await fetch(
          `/api/viop/destinos?origemId=${encodeURIComponent(origemId)}&q=`
        );
        const data: ViopCitiesResponse = await response.json();
        
        if (data.ok && data.items) {
          const formatted = data.items.map(city => ({
            id: city.id,
            nome: formatViopCity(city.nome)
          }));
          setAllDestinations(formatted);
        }
      } catch (error) {
        console.error('Erro ao buscar destinos:', error);
      }
    };

    fetchDestinations();
  }, [origemId]);

  useEffect(() => {
    if (allDestinations.length === 0) return;

    if (!destinoTerm || destinoTerm.trim() === '') {
      setDestinoSuggestions(allDestinations.slice(0, 10));
    } else {
      const normalized = normalizeForSearch(destinoTerm);
      const filtered = allDestinations.filter(city => 
        normalizeForSearch(city.nome).includes(normalized)
      );
      setDestinoSuggestions(filtered.slice(0, 10));
    }
  }, [destinoTerm, allDestinations]);

  const buscarMenorPreco = async () => {
    if (!origemId || !destinoId) return;

    try {
      setBuscandoPreco(true);
      setValorEncontrado(null);
      setMensagem(null);

      const hoje = new Date().toISOString().split('T')[0];

      const viopAdapter = await import('@/services/viop-adapter');
      const adapter = new viopAdapter.ViopAdapter();
      
      const trips = await adapter.searchTrips({
        departureCity: origemId,
        arrivalCity: destinoId,
        departureDate: hoje,
        passengers: 1,
      });

      if (trips.length === 0) {
        setMensagem({ tipo: 'erro', texto: 'Nenhuma viagem encontrada para esta rota' });
        return;
      }

      const menorPreco = Math.min(...trips.map(t => t.price));
      setValorEncontrado(menorPreco);
      
      setMensagem({ 
        tipo: 'sucesso', 
        texto: `Menor preço encontrado: R$ ${menorPreco.toFixed(2)}` 
      });

    } catch (error) {
      console.error('Erro ao buscar preço:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao buscar preço da rota' });
    } finally {
      setBuscandoPreco(false);
    }
  };

  useEffect(() => {
    if (origemId && destinoId && !editando) {
      buscarMenorPreco();
    }
  }, [origemId, destinoId]);

  const selectOrigem = (city: CityOption) => {
    setOrigemId(city.id);
    setOrigemTerm(city.nome);
    setShowOrigemDropdown(false);
    setDestinoId('');
    setDestinoTerm('');
    setValorEncontrado(null);
  };

  const selectDestino = (city: CityOption) => {
    setDestinoId(city.id);
    setDestinoTerm(city.nome);
    setShowDestinoDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!origemId || !destinoId || !valorEncontrado) {
      setMensagem({ tipo: 'erro', texto: 'Selecione origem, destino e aguarde o preço' });
      return;
    }

    try {
      setSalvando(true);
      setMensagem(null);

      const method = editando ? 'PUT' : 'POST';
      const body = editando 
        ? { id: editando, origem: origemTerm, destino: destinoTerm, origemId, destinoId, valor: valorEncontrado }
        : { origem: origemTerm, destino: destinoTerm, origemId, destinoId, valor: valorEncontrado };

      const response = await fetch('/api/admin/ofertas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setMensagem({ 
          tipo: 'sucesso', 
          texto: editando ? 'Oferta atualizada' : 'Oferta criada' 
        });
        limparFormulario();
        carregarOfertas();
      } else {
        setMensagem({ tipo: 'erro', texto: data.error || 'Erro ao salvar' });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar oferta' });
    } finally {
      setSalvando(false);
    }
  };

  const limparFormulario = () => {
    setEditando(null);
    setOrigemId('');
    setDestinoId('');
    setOrigemTerm('');
    setDestinoTerm('');
    setValorEncontrado(null);
  };

  const toggleAtivo = async (oferta: Oferta) => {
    try {
      const response = await fetch('/api/admin/ofertas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: oferta.id, ativo: !oferta.ativo }),
      });

      const data = await response.json();
      if (data.success) {
        carregarOfertas();
        setMensagem({ 
          tipo: 'sucesso', 
          texto: `Oferta ${!oferta.ativo ? 'ativada' : 'desativada'}` 
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao alterar status' });
    }
  };

  const deletarOferta = async (id: string) => {
    if (!confirm('Confirmar exclusão desta oferta?')) return;

    try {
      const response = await fetch(`/api/admin/ofertas?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setMensagem({ tipo: 'sucesso', texto: 'Oferta excluída' });
        carregarOfertas();
      } else {
        setMensagem({ tipo: 'erro', texto: data.error || 'Erro ao excluir' });
      }
    } catch (error) {
      console.error('Erro:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao excluir oferta' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Ofertas em Destaque
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Selecione origem e destino para buscar automaticamente o menor preço disponível
          </p>
        </div>

        {mensagem && (
          <div
            className={`mb-6 px-4 py-3 rounded-md text-sm ${
              mensagem.tipo === 'sucesso'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-medium text-slate-900">
              {editando ? 'Editar Oferta' : 'Nova Oferta'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Origem
                </label>
                <input
                  type="text"
                  value={origemTerm}
                  onChange={(e) => {
                    setOrigemTerm(e.target.value);
                    setShowOrigemDropdown(true);
                  }}
                  onFocus={() => setShowOrigemDropdown(true)}
                  onBlur={() => setTimeout(() => setShowOrigemDropdown(false), 200)}
                  placeholder="Digite a cidade de origem"
                  className="block w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-md
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder:text-slate-400"
                  required
                  disabled={editando !== null}
                />
                {showOrigemDropdown && origemSuggestions.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                    {origemSuggestions.map((city, index) => (
                      <button
                        key={`${city.id}-${index}`}
                        type="button"
                        onClick={() => selectOrigem(city)}
                        className="w-full px-3 py-2 text-left text-sm text-slate-900 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        {city.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Destino
                </label>
                <input
                  type="text"
                  value={destinoTerm}
                  onChange={(e) => {
                    setDestinoTerm(e.target.value);
                    setShowDestinoDropdown(true);
                  }}
                  onFocus={() => setShowDestinoDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDestinoDropdown(false), 200)}
                  placeholder="Digite a cidade de destino"
                  className="block w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-md
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                  required
                  disabled={!origemId || editando !== null}
                />
                {showDestinoDropdown && destinoSuggestions.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                    {destinoSuggestions.map((city, index) => (
                      <button
                        key={`${city.id}-${index}`}
                        type="button"
                        onClick={() => selectDestino(city)}
                        className="w-full px-3 py-2 text-left text-sm text-slate-900 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        {city.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Valor (menor preço)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-slate-500">R$</span>
                  <input
                    type="text"
                    value={
                      buscandoPreco 
                        ? 'Buscando...' 
                        : valorEncontrado !== null 
                          ? valorEncontrado.toFixed(2).replace('.', ',')
                          : ''
                    }
                    readOnly
                    placeholder="Aguardando busca"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md
                             bg-slate-50 text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                disabled={salvando || !valorEncontrado}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white
                         bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2
                         focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50
                         disabled:cursor-not-allowed transition-colors"
              >
                {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Adicionar'}
              </button>

              {(editando || origemTerm || destinoTerm) && (
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700
                           bg-white border border-slate-300 rounded-md hover:bg-slate-50
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                           transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-3 text-sm text-slate-600">Carregando...</p>
            </div>
          ) : ofertas.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-600">Nenhuma oferta cadastrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Origem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Destino
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {ofertas.map((oferta) => (
                    <tr key={oferta.id} className={`${!oferta.ativo ? 'opacity-50' : ''} hover:bg-slate-50 transition-colors`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {oferta.origem}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {oferta.destino}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        R$ {(oferta.valor / 100).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                            oferta.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {oferta.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleAtivo(oferta)}
                            className="text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            {oferta.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => deletarOferta(oferta.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Excluir
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
    </div>
  );
}