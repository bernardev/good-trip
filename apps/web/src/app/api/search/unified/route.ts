import { NextRequest, NextResponse } from 'next/server';
import { DistribusionReverseAdapter } from '@/services/distribusion-reverse-adapter';
import { ViopAdapter } from '@/services/viop-adapter';
import { UnifiedSearchResult, UnifiedTrip } from '@/types/unified-trip';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { departureCity, arrivalCity, departureDate, passengers } = body;

    if (!departureCity || !arrivalCity || !departureDate) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: departureCity, arrivalCity, departureDate' },
        { status: 400 }
      );
    }

    console.log('🔍 Busca Unificada:', {
      departureCity,
      arrivalCity,
      departureDate,
      passengers,
    });

    // Parse dos IDs (formato: "viopId|distribusionId" ou só um deles)
    const departureParts = departureCity.split('|');
    const arrivalParts = arrivalCity.split('|');

    // Identifica qual é VIOP e qual é Distribusion (VIOP tem números, Distribusion tem letras)
    const isViopId = (id: string): boolean => /^\d+$/.test(id);

    const departureViopId = departureParts.find(isViopId);
    const departureDistId = departureParts.find((id: string) => !isViopId(id));

    const arrivalViopId = arrivalParts.find(isViopId);
    const arrivalDistId = arrivalParts.find((id: string) => !isViopId(id));

    console.log('📋 IDs parseados:', {
      departure: { viop: departureViopId, dist: departureDistId },
      arrival: { viop: arrivalViopId, dist: arrivalDistId },
    });

    // Inicializa adapters
    const distribusionAdapter = new DistribusionReverseAdapter();
    const viopAdapter = new ViopAdapter();

    // Busca paralela em ambas APIs
    const searchPromises = [];

    // Busca Distribusion (se tiver IDs)
    if (departureDistId && arrivalDistId) {
      console.log('🔵 Buscando na Distribusion:', { departureDistId, arrivalDistId });
      searchPromises.push(
        distribusionAdapter.searchTrips({
          departureCity: departureDistId,
          arrivalCity: arrivalDistId,
          departureDate,
          passengers: passengers || 1,
        })
      );
    } else {
      console.log('⏭️  Pulando Distribusion (IDs faltando)');
      searchPromises.push(Promise.resolve([]));
    }

    // Busca VIOP (se tiver IDs)
    if (departureViopId && arrivalViopId) {
      console.log('🟢 Buscando na VIOP:', { departureViopId, arrivalViopId });
      searchPromises.push(
        viopAdapter.searchTrips({
          departureCity: departureViopId,
          arrivalCity: arrivalViopId,
          departureDate,
          passengers: passengers || 1,
        })
      );
    } else {
      console.log('⏭️  Pulando VIOP (IDs faltando)');
      searchPromises.push(Promise.resolve([]));
    }

    const [distribusionTrips, viopTrips] = await Promise.allSettled(searchPromises);

    // Processa resultados Distribusion
    const distribusionResults: UnifiedTrip[] =
      distribusionTrips.status === 'fulfilled' ? distribusionTrips.value : [];
    const distribusionError =
      distribusionTrips.status === 'rejected' ? distribusionTrips.reason : null;

    // Processa resultados VIOP
    const viopResults: UnifiedTrip[] =
      viopTrips.status === 'fulfilled' ? viopTrips.value : [];
    const viopError = viopTrips.status === 'rejected' ? viopTrips.reason : null;

    console.log('✅ Distribusion:', distribusionResults.length, 'viagens');
    console.log('✅ VIOP:', viopResults.length, 'viagens');

    if (distribusionError) {
      console.error('❌ Erro Distribusion:', distribusionError);
    }
    if (viopError) {
      console.error('❌ Erro VIOP:', viopError);
    }

    // Combina e ordena resultados por horário de partida
    const allTrips = [...distribusionResults, ...viopResults].sort((a, b) => {
      return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
    });

    const result: UnifiedSearchResult = {
      trips: allTrips,
      searchParams: {
        departureCity,
        arrivalCity,
        departureDate,
        passengers: passengers || 1,
      },
      providers: {
        distribusion: {
          success: distribusionTrips.status === 'fulfilled',
          count: distribusionResults.length,
          error: distribusionError?.message,
        },
        viop: {
          success: viopTrips.status === 'fulfilled',
          count: viopResults.length,
          error: viopError?.message,
        },
      },
    };

    console.log('📦 Total:', allTrips.length, 'viagens encontradas');

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Erro na busca unificada:', error);
    return NextResponse.json(
      { error: 'Erro ao processar busca unificada' },
      { status: 500 }
    );
  }
}