// apps/web/src/app/busca-unificada/route.ts
import { NextResponse } from "next/server";
import { DistribusionReverseAdapter } from "@/services/distribusion-reverse-adapter";
import { Viop } from "@/lib/viop";
import type {
  UnifiedTrip,
  UnifiedSearchResult,
  ProviderResult,
  ViopTrip,
} from "@/types/unified-trip";

/** ----------------- Tipos locais dos parâmetros ----------------- */
type DistribusionQuery = {
  departureCity: string;   // ex: BRXDM
  arrivalCity: string;     // ex: BRIUN
  departureDate: string;   // YYYY-MM-DD
  passengers: number;      // >= 1
};

type ViopQuery = {
  origemId: string;        // id interno
  destinoId: string;       // id interno
  date: string;            // YYYY-MM-DD
  origemName?: string;     // opcional
  destinoName?: string;    // opcional
};

/** Converte querystring em objetos de parâmetros (sem any) */
function readDistribusionParams(sp: URLSearchParams): DistribusionQuery | null {
  const departureCity = sp.get("departureCity");
  const arrivalCity = sp.get("arrivalCity");
  const departureDate = sp.get("date") ?? sp.get("departureDate"); // aceita "date" ou "departureDate"
  const passengersRaw = sp.get("pax") ?? sp.get("passengers");
  const passengers = passengersRaw ? Number(passengersRaw) : 1;

  if (!departureCity || !arrivalCity || !departureDate) return null;
  return { departureCity, arrivalCity, departureDate, passengers: Math.max(1, passengers) };
}

function readViopParams(sp: URLSearchParams): ViopQuery | null {
  const origemId = sp.get("origemId");
  const destinoId = sp.get("destinoId");
  const date = sp.get("date");

  if (!origemId || !destinoId || !date) return null;

  const origemName = sp.get("origemName") ?? undefined;
  const destinoName = sp.get("destinoName") ?? undefined;
  return { origemId, destinoId, date, origemName, destinoName };
}

/** ----------------- Mapeamento VIOP -> UnifiedTrip ----------------- */
type CorridaViop = {
  id: string;
  dataPartida: string;   // ISO
  dataChegada: string;   // ISO
  duracaoMin: number;    // minutos
  operadora: string;     // nome da viação
  tarifaDesde: number;   // BRL
};

function corridaToUnified(c: CorridaViop, p: ViopQuery): UnifiedTrip {
  const raw: ViopTrip = {
    id: c.id,
    origem: p.origemName ?? p.origemId,
    destino: p.destinoName ?? p.destinoId,
    dataHoraSaida: c.dataPartida,
    dataHoraChegada: c.dataChegada,
    duracao: c.duracaoMin,
    empresa: c.operadora,
    valor: c.tarifaDesde,
    poltronasDisponiveis: undefined,
    tipoOnibus: undefined,
    servicos: undefined,
  };

  return {
    id: `viop-${c.id}`,
    provider: "viop",
    departureCity: p.origemName ?? p.origemId,
    departureCityCode: p.origemId,
    arrivalCity: p.destinoName ?? p.destinoId,
    arrivalCityCode: p.destinoId,
    departureTime: c.dataPartida,
    arrivalTime: c.dataChegada,
    duration: c.duracaoMin,
    carrier: c.operadora,
    price: c.tarifaDesde,
    currency: "BRL",
    availableSeats: undefined,
    busType: undefined,
    amenities: [],
    bookingUrl: `/buscar-viop/pre-compra?servico=${encodeURIComponent(
      c.id
    )}&origem=${encodeURIComponent(p.origemId)}&destino=${encodeURIComponent(
      p.destinoId
    )}&data=${encodeURIComponent(p.date)}`,
    rawData: raw,
  };
}

/** ----------------- Handler ----------------- */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const dParams = readDistribusionParams(sp);
  const vParams = readViopParams(sp);

  if (!dParams && !vParams) {
    return NextResponse.json(
      { ok: false, error: "Parâmetros insuficientes para Distribusion e VIOP." },
      { status: 400 }
    );
  }

  // Execução em paralelo do que estiver disponível
  const distPromise: Promise<UnifiedTrip[] | null> = dParams
    ? new DistribusionReverseAdapter().searchTrips({
        departureCity: dParams.departureCity,
        arrivalCity: dParams.arrivalCity,
        departureDate: dParams.departureDate,
        passengers: dParams.passengers,
      })
    : Promise.resolve(null);

  const viopPromise: Promise<UnifiedTrip[] | null> = vParams
    ? Viop.buscarCorridas(vParams.origemId, vParams.destinoId, vParams.date).then((arr) =>
        (arr as CorridaViop[]).map((c) => corridaToUnified(c, vParams))
      )
    : Promise.resolve(null);

  let distTrips: UnifiedTrip[] = [];
  let viopTrips: UnifiedTrip[] = [];

  const providers: { distribusion: ProviderResult; viop: ProviderResult } = {
    distribusion: { success: false, count: 0 },
    viop: { success: false, count: 0 },
  };

  // Distribusion
  try {
    const res = await distPromise;
    if (res) {
      distTrips = res;
      providers.distribusion = { success: true, count: res.length };
    } else if (!dParams) {
      providers.distribusion = {
        success: false,
        count: 0,
        error: "Parâmetros ausentes",
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    providers.distribusion = { success: false, count: 0, error: msg };
  }

  // VIOP
  try {
    const res = await viopPromise;
    if (res) {
      viopTrips = res;
      providers.viop = { success: true, count: res.length };
    } else if (!vParams) {
      providers.viop = {
        success: false,
        count: 0,
        error: "Parâmetros ausentes",
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    providers.viop = { success: false, count: 0, error: msg };
  }

  // Merge + ordena por preço asc
  const trips: UnifiedTrip[] = [...distTrips, ...viopTrips].sort(
    (a, b) => a.price - b.price
  );

  // Monta payload no seu formato
  const payload: UnifiedSearchResult = {
    trips,
    searchParams: {
      departureCity: dParams?.departureCity ?? "",
      arrivalCity: dParams?.arrivalCity ?? "",
      departureDate: dParams?.departureDate ?? (vParams?.date ?? ""),
      passengers: dParams?.passengers ?? 1,
    },
    providers,
  };

  return NextResponse.json(payload, { status: 200 });
}
