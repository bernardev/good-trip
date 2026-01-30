// apps/web/src/app/components/search/HomeSearchWidget.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, MapPin, ArrowRight, Bus, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { ViopCitiesResponse } from '@/types/unified-trip'

interface CityOption {
  nome: string
  id: string
}

// ========== COMPONENTE DATE PICKER CUSTOMIZADO ==========
interface CustomDatePickerProps {
  value: string
  onChange: (date: string) => void
  minDate?: Date
  disabled?: boolean
  placeholder?: string
  label: string
}

function CustomDatePicker({ value, onChange, minDate, disabled, placeholder, label }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value + 'T00:00:00') : new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  const today = startOfDay(new Date())
  const minDateNormalized = minDate ? startOfDay(minDate) : today

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Atualizar mês quando valor mudar
  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value + 'T00:00:00'))
    }
  }, [value])

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  const startDayOfWeek = startOfMonth(currentMonth).getDay()

  const handleDateSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'))
    setIsOpen(false)
  }

  const isDateDisabled = (date: Date) => {
    return isBefore(startOfDay(date), minDateNormalized)
  }

  const selectedDate = value ? new Date(value + 'T00:00:00') : null

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr + 'T00:00:00')
    return format(date, 'dd/MM/yyyy')
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="relative" ref={containerRef}>
      {/* Input Display */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`relative cursor-pointer group ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10 pointer-events-none transition-transform ${
          disabled ? 'text-gray-300' : 'text-gray-400 group-hover:scale-110'
        }`} />
        <div
          className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl transition-all text-left ${
            disabled
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              : isOpen
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white'
                : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          {value ? (
            <span className="text-gray-800 font-medium">{formatDisplayDate(value)}</span>
          ) : (
            <span className="text-gray-400">{placeholder || 'Selecione a data'}</span>
          )}
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && !disabled && (
        <div 
          className="absolute left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl p-4"
          style={{ minWidth: '300px', zIndex: 9999 }}
        >
          {/* Header com navegação */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="font-semibold text-gray-800 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Dias da semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px' }}>
            {weekDays.map((day) => (
              <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', padding: '8px 0' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Dias do mês */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {/* Espaços vazios para alinhar o primeiro dia */}
            {Array.from({ length: startDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} style={{ padding: '8px' }} />
            ))}
            
            {daysInMonth.map((date) => {
              const isDisabled = isDateDisabled(date)
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isToday = isSameDay(date, today)

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDateSelect(date)}
                  style={{
                    padding: '8px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    transition: 'all 0.15s',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    backgroundColor: isSelected ? '#2563eb' : isToday ? '#dbeafe' : 'transparent',
                    color: isDisabled ? '#d1d5db' : isSelected ? '#ffffff' : isToday ? '#1d4ed8' : '#374151',
                    fontWeight: isSelected || isToday ? '600' : '400',
                    border: 'none',
                    width: '100%',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled && !isSelected) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDisabled && !isSelected) {
                      e.currentTarget.style.backgroundColor = isToday ? '#dbeafe' : 'transparent'
                    }
                  }}
                >
                  {format(date, 'd')}
                </button>
              )
            })}
          </div>

          {/* Botão Limpar */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setCurrentMonth(today)
              }}
              className="w-full py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ========== COMPONENTE PRINCIPAL ==========
export default function HomeSearchWidget() {
  const router = useRouter()
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway')
  
  const [departureCity, setDepartureCity] = useState('')
  const [arrivalCity, setArrivalCity] = useState('')
  const [departureTerm, setDepartureTerm] = useState('')
  const [arrivalTerm, setArrivalTerm] = useState('')
  
  const [allDepartureCities, setAllDepartureCities] = useState<CityOption[]>([])
  const [allArrivalCities, setAllArrivalCities] = useState<CityOption[]>([])
  const [departureSuggestions, setDepartureSuggestions] = useState<CityOption[]>([])
  const [arrivalSuggestions, setArrivalSuggestions] = useState<CityOption[]>([])
  
  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false)
  const [showArrivalDropdown, setShowArrivalDropdown] = useState(false)
  
  const [departureDate, setDepartureDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [returnDate, setReturnDate] = useState<string>('')

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

  // Atualizar returnDate se departureDate mudar e returnDate for anterior
  useEffect(() => {
    if (returnDate && departureDate && returnDate < departureDate) {
      setReturnDate('')
    }
  }, [departureDate, returnDate])

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 md:p-8" style={{ overflow: 'visible' }}>
        
        {/* Título */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          Compre sua passagem de ônibus
        </h2>

        {/* MOBILE: Layout vertical */}
        <div className="md:hidden space-y-4">
          {/* Origem */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Origem</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                type="text"
                value={departureTerm}
                onChange={(e) => {
                  setDepartureTerm(e.target.value)
                  setShowDepartureDropdown(true)
                }}
                onFocus={() => setShowDepartureDropdown(true)}
                onBlur={() => setTimeout(() => setShowDepartureDropdown(false), 200)}
                placeholder="De onde você vai sair?"
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            {showDepartureDropdown && departureSuggestions.length > 0 && (
              <div className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto" style={{ zIndex: 10000 }}>
                {departureSuggestions.map((city, index) => (
                  <button
                    key={`${city.id}-${index}`}
                    type="button"
                    onClick={() => selectDeparture(city)}
                    className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-all border-b border-gray-100 last:border-0"
                  >
                    <div className="font-medium text-gray-800">{city.nome}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão Swap Circular */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={swapCities}
              disabled={!departureCity || !arrivalCity}
              className="p-3 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-full hover:scale-110 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          {/* Destino */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Destino</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                type="text"
                value={arrivalTerm}
                onChange={(e) => {
                  setArrivalTerm(e.target.value)
                  setShowArrivalDropdown(true)
                }}
                onFocus={() => setShowArrivalDropdown(true)}
                onBlur={() => setTimeout(() => setShowArrivalDropdown(false), 200)}
                placeholder="Para onde você vai?"
                disabled={!departureCity}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:bg-gray-100"
              />
            </div>
            {showArrivalDropdown && arrivalSuggestions.length > 0 && (
              <div className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto" style={{ zIndex: 10000 }}>
                {arrivalSuggestions.map((city, index) => (
                  <button
                    key={`${city.id}-${index}`}
                    type="button"
                    onClick={() => selectArrival(city)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-all border-b border-gray-100 last:border-0"
                  >
                    <div className="font-medium text-gray-800">{city.nome}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Radio Buttons */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                tripType === 'oneway' 
                  ? 'border-blue-600 bg-blue-600' 
                  : 'border-gray-300 bg-white'
              }`}>
                {tripType === 'oneway' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </div>
              <input
                type="radio"
                name="tripType"
                checked={tripType === 'oneway'}
                onChange={() => setTripType('oneway')}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-700">Somente Ida</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                tripType === 'roundtrip' 
                  ? 'border-blue-600 bg-blue-600' 
                  : 'border-gray-300 bg-white'
              }`}>
                {tripType === 'roundtrip' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </div>
              <input
                type="radio"
                name="tripType"
                checked={tripType === 'roundtrip'}
                onChange={() => setTripType('roundtrip')}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-700">Ida e Volta</span>
            </label>
          </div>

          {/* Datas com Date Picker Customizado */}
          <div 
            className={`grid gap-3 ${tripType === 'roundtrip' ? 'grid-cols-2' : 'grid-cols-1'}`}
            style={{ overflow: 'visible', position: 'relative', zIndex: 100 }}
          >
            {/* Data de Ida */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data de ida
              </label>
              <CustomDatePicker
                value={departureDate}
                onChange={setDepartureDate}
                minDate={new Date()}
                label="Data de ida"
                placeholder="Selecione"
              />
            </div>

            {/* Data de Volta */}
            {tripType === 'roundtrip' && (
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data de volta
                </label>
                <CustomDatePicker
                  value={returnDate}
                  onChange={setReturnDate}
                  minDate={departureDate ? new Date(departureDate + 'T00:00:00') : new Date()}
                  label="Data de volta"
                  placeholder="Selecione"
                />
              </div>
            )}
          </div>

          {/* Botão Buscar Mobile */}
          <button
            onClick={handleSearch}
            disabled={!departureCity || !arrivalCity || !departureDate}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-sky-600 text-white text-lg font-bold rounded-xl hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Buscar
          </button>
        </div>

        {/* DESKTOP: Layout horizontal em 1 linha */}
        <div className="hidden md:block">
          {/* Radio Buttons no topo */}
          <div className="flex gap-6 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tripTypeDesktop"
                checked={tripType === 'oneway'}
                onChange={() => setTripType('oneway')}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-base font-semibold text-gray-700">Somente Ida</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tripTypeDesktop"
                checked={tripType === 'roundtrip'}
                onChange={() => setTripType('roundtrip')}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-base font-semibold text-gray-700">Ida e Volta</span>
            </label>
          </div>

          {/* Linha única com todos os campos */}
          <div className="flex items-end gap-3">
            {/* Origem */}
            <div className="relative flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Origem</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  value={departureTerm}
                  onChange={(e) => {
                    setDepartureTerm(e.target.value)
                    setShowDepartureDropdown(true)
                  }}
                  onFocus={() => setShowDepartureDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDepartureDropdown(false), 200)}
                  placeholder="De onde você vai sair?"
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
              {showDepartureDropdown && departureSuggestions.length > 0 && (
                <div className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto" style={{ zIndex: 10000 }}>
                  {departureSuggestions.map((city, index) => (
                    <button
                      key={`${city.id}-${index}`}
                      type="button"
                      onClick={() => selectDeparture(city)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-all border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-gray-800">{city.nome}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botão Swap */}
            <button
              type="button"
              onClick={swapCities}
              disabled={!departureCity || !arrivalCity}
              className="p-3.5 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-xl hover:scale-110 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed mb-0.5"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>

            {/* Destino */}
            <div className="relative flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Destino</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  value={arrivalTerm}
                  onChange={(e) => {
                    setArrivalTerm(e.target.value)
                    setShowArrivalDropdown(true)
                  }}
                  onFocus={() => setShowArrivalDropdown(true)}
                  onBlur={() => setTimeout(() => setShowArrivalDropdown(false), 200)}
                  placeholder="Para onde você vai?"
                  disabled={!departureCity}
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:bg-gray-100"
                />
              </div>
              {showArrivalDropdown && arrivalSuggestions.length > 0 && (
                <div className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto" style={{ zIndex: 10000 }}>
                  {arrivalSuggestions.map((city, index) => (
                    <button
                      key={`${city.id}-${index}`}
                      type="button"
                      onClick={() => selectArrival(city)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-all border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-gray-800">{city.nome}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Data Ida - Desktop */}
            <div className="relative flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ida</label>
              <CustomDatePicker
                value={departureDate}
                onChange={setDepartureDate}
                minDate={new Date()}
                label="Ida"
                placeholder="Selecione"
              />
            </div>

            {/* Data Volta - Desktop */}
            {tripType === 'roundtrip' && (
              <div className="relative flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Volta</label>
                <CustomDatePicker
                  value={returnDate}
                  onChange={setReturnDate}
                  minDate={departureDate ? new Date(departureDate + 'T00:00:00') : new Date()}
                  label="Volta"
                  placeholder="Selecione"
                />
              </div>
            )}

            {/* Botão Buscar Desktop */}
            <button
              onClick={handleSearch}
              disabled={!departureCity || !arrivalCity || !departureDate}
              className="px-12 py-3.5 bg-gradient-to-r from-blue-600 to-sky-600 text-white text-lg font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Buscar
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}