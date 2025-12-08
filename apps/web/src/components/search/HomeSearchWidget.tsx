// apps/web/src/app/components/search/HomeSearchWidget.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, MapPin, ArrowRight, Bus, Sparkles } from 'lucide-react'
import { ViopCitiesResponse } from '@/types/unified-trip'

type InputWithPicker = HTMLInputElement & {
  showPicker?: () => void
}

interface CityOption {
  nome: string
  id: string
}

export default function HomeSearchWidget() {
  const router = useRouter()
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway')
  
  // IDs das cidades selecionadas
  const [departureCity, setDepartureCity] = useState('')
  const [arrivalCity, setArrivalCity] = useState('')
  
  // Termos de busca (texto digitado)
  const [departureTerm, setDepartureTerm] = useState('')
  const [arrivalTerm, setArrivalTerm] = useState('')
  
  // Cache completo de cidades
  const [allDepartureCities, setAllDepartureCities] = useState<CityOption[]>([])
  const [allArrivalCities, setAllArrivalCities] = useState<CityOption[]>([])
  
  // Sugestões filtradas
  const [departureSuggestions, setDepartureSuggestions] = useState<CityOption[]>([])
  const [arrivalSuggestions, setArrivalSuggestions] = useState<CityOption[]>([])
  
  // Controle de dropdowns
  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false)
  const [showArrivalDropdown, setShowArrivalDropdown] = useState(false)
  
  // Datas
  const [departureDate, setDepartureDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [returnDate, setReturnDate] = useState<string>('')

  // 🔥 NOVO: Refs para os inputs de data
  const departureDateRef = useRef<HTMLInputElement>(null)
  const returnDateRef = useRef<HTMLInputElement>(null)

  // 🔥 NOVO: Função para abrir o calendário (funciona em todos os navegadores)
const openDatePicker = (inputRef: React.RefObject<HTMLInputElement | null>) => {
  const input = inputRef.current as InputWithPicker | null
  if (!input) return

  try {
    if (typeof input.showPicker === 'function') {
      input.showPicker()
    } else {
      input.focus()
      input.click()
    }
  } catch {
    input.focus()
    input.click()
  }
}

  // ========== FUNÇÕES DE FORMATAÇÃO ==========
  const parseViopCityName = (name: string): { cidade: string; estado: string } => {
    const cleaned = name.trim().toUpperCase()
    const stateMatch = cleaned.match(/[A-Z]{2}$/)
    const estado = stateMatch ? stateMatch[0] : ''
    const cidadeMatch = cleaned.match(/^([^-]+)/)
    const cidadeRaw = cidadeMatch ? cidadeMatch[1].trim() : cleaned
    const cidade = cidadeRaw
      .toLowerCase()
      .split(' ')
      .map((word) => 
        ['de', 'do', 'da', 'dos', 'das', 'e'].includes(word) 
          ? word 
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(' ')
      .replace(/\bSao\b/g, 'São')
    return { cidade, estado }
  }

  const formatViopCity = (nome: string): string => {
    const { cidade, estado } = parseViopCityName(nome)
    return estado ? `${cidade}/${estado}` : cidade
  }

  const normalizeForSearch = (text: string): string => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  // ========== EFEITOS ==========
  useEffect(() => {
    const fetchAllOrigins = async () => {
      try {
        const response = await fetch('/api/viop/origens?q=')
        const data: ViopCitiesResponse = await response.json()
        
        if (data.ok && data.items) {
          const formatted = data.items.map(city => ({
            id: city.id,
            nome: formatViopCity(city.nome)
          }))
          setAllDepartureCities(formatted)
        }
      } catch (error) {
        console.error('Erro ao buscar todas as origens:', error)
      }
    }

    fetchAllOrigins()
  }, [])

  useEffect(() => {
    if (allDepartureCities.length === 0) return

    if (!departureTerm || departureTerm.trim() === '') {
      setDepartureSuggestions(allDepartureCities)
    } else {
      const normalized = normalizeForSearch(departureTerm)
      const filtered = allDepartureCities.filter(city => 
        normalizeForSearch(city.nome).includes(normalized)
      )
      setDepartureSuggestions(filtered)
    }
  }, [departureTerm, allDepartureCities])

  useEffect(() => {
    if (!departureCity) {
      setAllArrivalCities([])
      setArrivalSuggestions([])
      return
    }

    const fetchDestinations = async () => {
      try {
        const response = await fetch(
          `/api/viop/destinos?origemId=${encodeURIComponent(departureCity)}&q=`
        )
        const data: ViopCitiesResponse = await response.json()
        
        if (data.ok && data.items) {
          const formatted = data.items.map(city => ({
            id: city.id,
            nome: formatViopCity(city.nome)
          }))
          setAllArrivalCities(formatted)
        }
      } catch (error) {
        console.error('Erro ao buscar destinos:', error)
      }
    }

    fetchDestinations()
  }, [departureCity])

  useEffect(() => {
    if (allArrivalCities.length === 0) return

    if (!arrivalTerm || arrivalTerm.trim() === '') {
      setArrivalSuggestions(allArrivalCities)
    } else {
      const normalized = normalizeForSearch(arrivalTerm)
      const filtered = allArrivalCities.filter(city => 
        normalizeForSearch(city.nome).includes(normalized)
      )
      setArrivalSuggestions(filtered)
    }
  }, [arrivalTerm, allArrivalCities])

  // ========== HANDLERS ==========
  const selectDeparture = (city: CityOption) => {
    setDepartureCity(city.id)
    setDepartureTerm(city.nome)
    setShowDepartureDropdown(false)
    setArrivalCity('')
    setArrivalTerm('')
  }

  const selectArrival = (city: CityOption) => {
    setArrivalCity(city.id)
    setArrivalTerm(city.nome)
    setShowArrivalDropdown(false)
  }

  const handleSearch = () => {
    if (!departureCity || !arrivalCity || !departureDate) {
      alert('Preencha origem, destino e data de partida')
      return
    }

    const params = new URLSearchParams({
      origem: departureCity,
      destino: arrivalCity,
      data: departureDate,
      tipo: tripType,
      ...(tripType === 'roundtrip' && returnDate && { dataVolta: returnDate })
    })

    router.push(`/buscar-teste?${params.toString()}`)
  }

  const swapCities = () => {
    const tempId = departureCity
    setDepartureCity(arrivalCity)
    setArrivalCity(tempId)
    
    const tempName = departureTerm
    setDepartureTerm(arrivalTerm)
    setArrivalTerm(tempName)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Card Principal */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl p-6 md:p-10">
        {/* Gradiente de fundo sutil */}
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-50 via-white to-sky-50 -z-10" />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="relative p-4 bg-gradient-to-br from-blue-500 to-sky-600 rounded-2xl shadow-lg">
              <Bus className="w-8 md:w-10 h-8 md:h-10 text-white" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-600">
                Busque sua Viagem
              </h2>
              <p className="text-gray-600 text-sm md:text-base mt-1">
                As melhores passagens em um só lugar
              </p>
            </div>
          </div>
        </div>

        {/* Tipo de Viagem */}
        <div className="flex gap-3 mb-8 p-2 bg-gray-50 rounded-2xl">
          <button
            onClick={() => setTripType('oneway')}
            className={`flex-1 py-3 md:py-4 px-4 md:px-8 rounded-xl font-bold transition-all duration-300 text-sm md:text-base ${
              tripType === 'oneway'
                ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-xl shadow-blue-500/30 scale-105'
                : 'bg-transparent text-gray-700 hover:bg-white/50'
            }`}
          >
            🎫 Somente Ida
          </button>
          <button
            onClick={() => setTripType('roundtrip')}
            className={`flex-1 py-3 md:py-4 px-4 md:px-8 rounded-xl font-bold transition-all duration-300 text-sm md:text-base ${
              tripType === 'roundtrip'
                ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-xl shadow-blue-500/30 scale-105'
                : 'bg-transparent text-gray-700 hover:bg-white/50'
            }`}
          >
            🔄 Ida e Volta
          </button>
        </div>

        {/* Container Principal dos Campos - CAMPOS MAIS JUNTOS */}
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-4 md:p-6 mb-6">
          {/* Linha 1: Origem + Swap + Destino */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
            {/* Origem - EXPANDIDO */}
            <div className="relative flex-1">
              <label className="block text-xs font-bold text-blue-700 mb-2 ml-1">
                🚏 Origem
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 z-10" />
                <input
                  type="text"
                  value={departureTerm}
                  onChange={(e) => {
                    setDepartureTerm(e.target.value)
                    setShowDepartureDropdown(true)
                  }}
                  onFocus={() => setShowDepartureDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDepartureDropdown(false), 200)}
                  placeholder="De onde você sai?"
                  className="w-full pl-12 pr-4 py-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white hover:border-blue-300 font-medium text-gray-800 placeholder:text-gray-400"
                />
              </div>
              {showDepartureDropdown && departureSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {departureSuggestions.map((city, index) => (
                    <button
                      key={`${city.id}-${index}`}
                      type="button"
                      onClick={() => selectDeparture(city)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-all border-b border-gray-100 last:border-0 flex items-center justify-between group"
                    >
                      <div className="font-semibold text-gray-800 group-hover:text-blue-600">
                        {city.nome}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botão Swap - COMPACTO */}
            <div className="flex justify-center md:block md:mt-7">
              <button
                type="button"
                onClick={swapCities}
                disabled={!departureCity || !arrivalCity}
                className="p-3 bg-gradient-to-br from-blue-500 to-sky-600 text-white rounded-xl hover:scale-110 md:hover:rotate-180 transition-all duration-500 shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0"
                title="Trocar origem e destino"
              >
                <ArrowRight className="w-5 h-5 md:rotate-0 rotate-90" />
              </button>
            </div>

            {/* Destino - EXPANDIDO */}
            <div className="relative flex-1">
              <label className="block text-xs font-bold text-blue-700 mb-2 ml-1">
                📍 Destino
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-500 z-10" />
                <input
                  type="text"
                  value={arrivalTerm}
                  onChange={(e) => {
                    setArrivalTerm(e.target.value)
                    setShowArrivalDropdown(true)
                  }}
                  onFocus={() => setShowArrivalDropdown(true)}
                  onBlur={() => setTimeout(() => setShowArrivalDropdown(false), 200)}
                  placeholder={departureCity ? 'Para onde você vai?' : 'Selecione origem primeiro'}
                  disabled={!departureCity}
                  className="w-full pl-12 pr-4 py-4 border-2 border-blue-200 rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 outline-none transition-all bg-white hover:border-sky-300 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium text-gray-800 placeholder:text-gray-400"
                />
              </div>
              {showArrivalDropdown && arrivalSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {arrivalSuggestions.map((city, index) => (
                    <button
                      key={`${city.id}-${index}`}
                      type="button"
                      onClick={() => selectArrival(city)}
                      className="w-full px-4 py-3 text-left hover:bg-sky-50 transition-all border-b border-gray-100 last:border-0 flex items-center justify-between group"
                    >
                      <div className="font-semibold text-gray-800 group-hover:text-sky-600">
                        {city.nome}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Linha 2: Datas - 🔥 MELHORADO */}
          <div className={`grid ${tripType === 'roundtrip' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-3`}>
            {/* Data de Ida */}
            <div className="relative">
              <label 
                className="block text-xs font-bold text-blue-700 mb-2 ml-1 cursor-pointer"
                onClick={() => openDatePicker(departureDateRef)}
              >
                📅 Data de Ida
              </label>
              <div 
                className="relative cursor-pointer group"
                onClick={() => openDatePicker(departureDateRef)}
              >
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 z-10 pointer-events-none group-hover:scale-110 transition-transform" />
                <input
                  ref={departureDateRef}
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full pl-12 pr-4 py-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white hover:border-blue-300 font-medium text-gray-800 cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Data de Volta */}
            {tripType === 'roundtrip' && (
              <div className="relative">
                <label 
                  className="block text-xs font-bold text-blue-700 mb-2 ml-1 cursor-pointer"
                  onClick={() => openDatePicker(returnDateRef)}
                >
                  🔙 Data de Volta
                </label>
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => openDatePicker(returnDateRef)}
                >
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 z-10 pointer-events-none group-hover:scale-110 transition-transform" />
                  <input
                    ref={returnDateRef}
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={departureDate}
                    className="w-full pl-12 pr-4 py-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all bg-white hover:border-blue-300 font-medium text-gray-800 cursor-pointer"
                    required
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botão de Busca */}
        <button
          onClick={handleSearch}
          disabled={!departureCity || !arrivalCity || !departureDate}
          className="relative w-full py-5 md:py-6 bg-gradient-to-r from-blue-600 to-sky-600 text-white text-lg md:text-xl font-black rounded-2xl hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-sky-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Bus className="w-6 h-6 md:w-7 md:h-7 relative z-10 group-hover:animate-bounce" />
          <span className="relative z-10">Buscar Passagens Agora</span>
          <ArrowRight className="w-6 h-6 md:w-7 md:h-7 relative z-10 group-hover:translate-x-2 transition-transform" />
        </button>

        {/* Indicadores de Benefícios */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm">
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-blue-50 to-sky-50 rounded-full border border-blue-200">
            <span className="text-lg md:text-xl">💎</span>
            <span className="font-semibold text-blue-700">Melhores Preços</span>
          </div>
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-sky-50 to-blue-50 rounded-full border border-sky-200">
            <span className="text-lg md:text-xl">⚡</span>
            <span className="font-semibold text-sky-700">Compra Rápida</span>
          </div>
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-full border border-yellow-200">
            <span className="text-lg md:text-xl">🔒</span>
            <span className="font-semibold bg-gradient-to-r from-yellow-700 to-amber-600 bg-clip-text text-transparent">100% Seguro</span>
          </div>
        </div>
      </div>
    </div>
  )
}