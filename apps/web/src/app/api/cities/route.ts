import { NextResponse } from 'next/server';
import { TripAggregatorService } from '@/services/trip-aggregator';

const aggregator = new TripAggregatorService();

export async function GET() {
  try {
    const cities = await aggregator.getAllCities();

    return NextResponse.json({
      cities,
      total: cities.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar cidades:', errorMessage);
    return NextResponse.json(
      { error: 'Erro ao buscar cidades disponíveis' },
      { status: 500 }
    );
  }
}