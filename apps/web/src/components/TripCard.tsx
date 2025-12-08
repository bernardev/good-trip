'use client';

import { UnifiedTrip } from '@/types/unified-trip';
import { format } from 'date-fns';
import { Clock, MapPin, Users, Bus } from 'lucide-react';

interface TripCardProps {
  trip: UnifiedTrip;
  onSelect?: (trip: UnifiedTrip) => void;
}

/** Converte string p/ Date com fallback seguro */
function safeDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Formata horário HH:mm com fallback “--:--” */
function fmtTime(d: Date | null): string {
  return d ? format(d, 'HH:mm') : '--:--';
}

export function TripCard({ trip, onSelect }: TripCardProps) {
  const departureDt = safeDate(trip.departureTime);
  const arrivalDt = safeDate(trip.arrivalTime);

  const durationHours = Math.floor(trip.duration / 60);
  const durationMinutes = trip.duration % 60;
  const durationStr =
    durationMinutes > 0
      ? `${durationHours}h${String(durationMinutes).padStart(2, '0')}min`
      : `${durationHours}h`;

  const providerBadgeClass =
    trip.provider === 'distribusion'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800';

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-lg">{trip.carrier}</h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${providerBadgeClass}`}
            >
              {trip.provider === 'distribusion' ? 'Distribusion' : 'VIOP'}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: trip.currency,
            }).format(trip.price)}
          </div>
          {typeof trip.availableSeats === 'number' && trip.availableSeats < 10 && (
            <div className="text-xs text-red-600 flex items-center gap-1 justify-end">
              <Users className="w-3 h-3" />
              {trip.availableSeats} poltronas
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-2xl font-bold">
            {fmtTime(departureDt)}
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {trip.departureCity}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{durationStr}</span>
          </div>
          <div className="w-full h-px bg-gray-300 my-2" />
          <Bus className="w-5 h-5 text-gray-400" />
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold">
            {fmtTime(arrivalDt)}
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-1 justify-end">
            <MapPin className="w-4 h-4" />
            {trip.arrivalCity}
          </div>
        </div>
      </div>

      {trip.amenities && trip.amenities.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {trip.amenities.slice(0, 4).map((amenity, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
              >
                {amenity}
              </span>
            ))}
            {trip.amenities.length > 4 && (
              <span className="text-xs text-gray-500">
                +{trip.amenities.length - 4} mais
              </span>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => onSelect?.(trip)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        Selecionar Viagem
      </button>
    </div>
  );
}
