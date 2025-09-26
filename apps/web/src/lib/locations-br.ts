// Cache e helpers para cidades e pares conectados no BR
export type City = {
  code: string;               // ex: BRSAO
  name: string;               // ex: São Paulo
  subdivision_code?: string;  // ex: SP
  country_code: string;       // ex: BR
  latitude: number;
  longitude: number;
};
export type ConnectedPair = { depCity: string; arrCity: string };

type CitiesResp = {
  data: Array<{
    id: string; type: "cities";
    attributes: {
      code: string; name: string;
      subdivision_code?: string | null;
      country_code: string; latitude: number; longitude: number;
    };
  }>;
};

type ConnectedStationsResp = {
  data: Array<{
    id: string; type: "connected_stations";
    relationships: {
      departure_station: { data: { id: string; type: "stations" } };
      arrival_station:   { data: { id: string; type: "stations" } };
    };
  }>;
};

const TTL_MS = 6 * 60 * 60 * 1000; // 6h

let citiesBRCache: { at: number; list: City[] } | null = null;
let pairsBRCache: { at: number; list: ConnectedPair[] } | null = null;

function baseURL(): string {
  const u = process.env.DISTRIBUSION_BASE_URL ?? "https://api.distribusion.com/retailers/v4";
  return u.endsWith("/") ? u : `${u}/`;
}
function partner(): string {
  return process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER ?? "";
}
function expired(x: { at: number } | null): boolean {
  return !x || Date.now() - x.at > TTL_MS;
}

// Baixa todas as cidades (filtra BR)
export async function getCitiesBR(): Promise<City[]> {
  if (!expired(citiesBRCache)) return citiesBRCache!.list;
  const url = new URL("cities", baseURL());
  url.searchParams.set("retailer_partner_number", partner());
  // alguns tenants aceitam filtro por país; se não, filtramos localmente
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`GET cities ${res.status}`);
  const j = (await res.json()) as CitiesResp;
  const list: City[] = j.data
    .map((c) => ({
      code: c.attributes.code,
      name: c.attributes.name,
      subdivision_code: c.attributes.subdivision_code ?? undefined,
      country_code: c.attributes.country_code,
      latitude: c.attributes.latitude,
      longitude: c.attributes.longitude,
    }))
    .filter((c) => c.country_code === "BR");
  citiesBRCache = { at: Date.now(), list };
  return list;
}

// Constrói pares cidade→cidade a partir de connected_stations (apenas BR)
export async function getConnectedPairsBR(): Promise<ConnectedPair[]> {
  if (!expired(pairsBRCache)) return pairsBRCache!.list;
  const url = new URL("connected_stations", baseURL());
  url.searchParams.set("retailer_partner_number", partner());
  url.searchParams.set("limit", "5000"); // aumentar conforme necessário
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`GET connected_stations ${res.status}`);
  const j = (await res.json()) as ConnectedStationsResp;

  // city code = 5 primeiras letras do station code (ex.: BRSAOxxxx → BRSAO)
  const toCity = (stationCode: string) => stationCode.slice(0, 5);

  const list: ConnectedPair[] = j.data
    .map((p) => ({
      depCity: toCity(p.relationships.departure_station.data.id),
      arrCity: toCity(p.relationships.arrival_station.data.id),
    }))
    .filter((p) => p.depCity.startsWith("BR") && p.arrCity.startsWith("BR"));

  // de-dup
  const key = (p: ConnectedPair) => `${p.depCity}-${p.arrCity}`;
  const uniq = Array.from(new Map(list.map((p) => [key(p), p])).values());

  pairsBRCache = { at: Date.now(), list: uniq };
  return uniq;
}

// utilidade
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
