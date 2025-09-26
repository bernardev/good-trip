import { NextRequest, NextResponse } from "next/server";

/* ==== Tipos ==== */
type Money = { amount: number; currency: string };
type Connection = { total_price?: Money };
type FindResp = { data?: Connection[] };

type PopularItem = { city: string; uf: string; fromCents: number };
type Cand = { city: string; uf: string; lat: number; lng: number };

/* ==== Helpers ==== */
const BASE = (process.env.DISTRIBUSION_BASE_URL ?? "https://api.distribusion.com/retailers/v4").replace(/\/$/, "") + "/";
const PARTNER = process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER ?? "";

function startISO(): string { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); }
function endISO(days: number): string { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(23,59,59,999); return d.toISOString(); }
const toRad = (deg: number) => (deg * Math.PI) / 180;
/** Haversine km */
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s1)));
}

async function minPriceByCoords(
  originLat: number, originLng: number, dst: Cand, days: number
): Promise<PopularItem | null> {
  const url = new URL("connections/find", BASE);
  url.searchParams.set("retailer_partner_number", PARTNER);
  url.searchParams.set("origin_latitude", String(originLat));
  url.searchParams.set("origin_longitude", String(originLng));
  url.searchParams.set("destination_latitude", String(dst.lat));
  url.searchParams.set("destination_longitude", String(dst.lng));
  url.searchParams.set("departure_time_min", startISO());
  url.searchParams.set("departure_time_max", endISO(days));
  url.searchParams.set("limit", "50");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;

  const j = (await res.json()) as FindResp;
  const list = j.data ?? [];
  if (list.length === 0) return null;

  let best = Number.POSITIVE_INFINITY;
  for (const c of list) {
    const cents = c.total_price?.amount ?? 0;
    if (cents > 0 && cents < best) best = cents;
  }
  if (!Number.isFinite(best)) return null;

  return { city: dst.city, uf: dst.uf, fromCents: best };
}

/* ==== Fallback BR (40+ cidades) ==== */
const CANDIDATES: Cand[] = [
  { city: "São Paulo", uf: "SP", lat: -23.5505, lng: -46.6333 },
  { city: "Campinas", uf: "SP", lat: -22.9099, lng: -47.0626 },
  { city: "Ribeirão Preto", uf: "SP", lat: -21.1775, lng: -47.8103 },
  { city: "São José do Rio Preto", uf: "SP", lat: -20.8113, lng: -49.3758 },
  { city: "Sorocaba", uf: "SP", lat: -23.5015, lng: -47.4526 },
  { city: "Santos", uf: "SP", lat: -23.9608, lng: -46.3336 },
  { city: "Bauru", uf: "SP", lat: -22.3246, lng: -49.0870 },
  { city: "Piracicaba", uf: "SP", lat: -22.7253, lng: -47.6492 },
  { city: "Jundiaí", uf: "SP", lat: -23.1857, lng: -46.8978 },

  { city: "Rio de Janeiro", uf: "RJ", lat: -22.9068, lng: -43.1729 },
  { city: "Niterói", uf: "RJ", lat: -22.8832, lng: -43.1034 },

  { city: "Belo Horizonte", uf: "MG", lat: -19.9167, lng: -43.9345 },
  { city: "Uberlândia", uf: "MG", lat: -18.9128, lng: -48.2755 },
  { city: "Juiz de Fora", uf: "MG", lat: -21.7642, lng: -43.3496 },
  { city: "Montes Claros", uf: "MG", lat: -16.7282, lng: -43.8582 },

  { city: "Curitiba", uf: "PR", lat: -25.4284, lng: -49.2733 },
  { city: "Ponta Grossa", uf: "PR", lat: -25.0945, lng: -50.1633 },
  { city: "Londrina", uf: "PR", lat: -23.3103, lng: -51.1628 },
  { city: "Maringá", uf: "PR", lat: -23.4200, lng: -51.9331 },
  { city: "Cascavel", uf: "PR", lat: -24.9555, lng: -53.4552 },
  { city: "Foz do Iguaçu", uf: "PR", lat: -25.5427, lng: -54.5827 },

  { city: "Florianópolis", uf: "SC", lat: -27.5949, lng: -48.5482 },
  { city: "Joinville", uf: "SC", lat: -26.3045, lng: -48.8487 },
  { city: "Blumenau", uf: "SC", lat: -26.9155, lng: -49.0709 },
  { city: "Chapecó", uf: "SC", lat: -27.1000, lng: -52.6152 },

  { city: "Porto Alegre", uf: "RS", lat: -30.0277, lng: -51.2287 },
  { city: "Caxias do Sul", uf: "RS", lat: -29.1678, lng: -51.1796 },
  { city: "Pelotas", uf: "RS", lat: -31.7710, lng: -52.3420 },

  { city: "Brasília", uf: "DF", lat: -15.7939, lng: -47.8828 },
  { city: "Goiânia", uf: "GO", lat: -16.6864, lng: -49.2643 },
  { city: "Anápolis", uf: "GO", lat: -16.3285, lng: -48.9534 },

  { city: "Campo Grande", uf: "MS", lat: -20.4697, lng: -54.6201 },
  { city: "Cuiabá", uf: "MT", lat: -15.6014, lng: -56.0979 },

  { city: "Vitória", uf: "ES", lat: -20.3155, lng: -40.3128 },
  { city: "Vila Velha", uf: "ES", lat: -20.3417, lng: -40.2875 },

  { city: "Salvador", uf: "BA", lat: -12.9777, lng: -38.5016 },
  { city: "Feira de Santana", uf: "BA", lat: -12.2664, lng: -38.9663 },

  { city: "Fortaleza", uf: "CE", lat: -3.7319, lng: -38.5267 },
  { city: "Recife", uf: "PE", lat: -8.0476, lng: -34.8770 },
  { city: "Maceió", uf: "AL", lat: -9.6498, lng: -35.7089 },
  { city: "Aracaju", uf: "SE", lat: -10.9472, lng: -37.0731 },
  { city: "Natal", uf: "RN", lat: -5.7936, lng: -35.1986 },
  { city: "João Pessoa", uf: "PB", lat: -7.1153, lng: -34.8610 },
  { city: "Teresina", uf: "PI", lat: -5.0919, lng: -42.8034 },
  { city: "São Luís", uf: "MA", lat: -2.5391, lng: -44.2825 },
  { city: "Belém", uf: "PA", lat: -1.4558, lng: -48.4902 },
  { city: "Manaus", uf: "AM", lat: -3.1190, lng: -60.0217 },

  // --- PARÁ (PA)
{ city: "Ananindeua",   uf: "PA", lat: -1.3650, lng: -48.3720 },
{ city: "Santarém",     uf: "PA", lat: -2.4431, lng: -54.7083 },
{ city: "Marabá",       uf: "PA", lat: -5.3811, lng: -49.1323 },
{ city: "Altamira",     uf: "PA", lat: -3.2041, lng: -52.2096 },
{ city: "Castanhal",    uf: "PA", lat: -1.2970, lng: -47.9280 },
{ city: "Parauapebas",  uf: "PA", lat: -6.0670, lng: -50.1880 },
{ city: "Abaetetuba",   uf: "PA", lat: -1.7210, lng: -48.8820 },
{ city: "Cametá",       uf: "PA", lat: -2.2429, lng: -49.4973 },
{ city: "Bragança",     uf: "PA", lat: -1.0610, lng: -46.7820 },
{ city: "Tucuruí",      uf: "PA", lat: -3.7650, lng: -49.6720 },
{ city: "Itaituba",     uf: "PA", lat: -4.2760, lng: -55.9830 },
{ city: "Redenção",     uf: "PA", lat: -8.0539, lng: -50.0318 },
// { city: "Breves",    uf: "PA", lat: -1.6800, lng: -50.4790 }, // opcional
// { city: "Capanema",  uf: "PA", lat: -1.1940, lng: -47.1800 }, // opcional

// --- AMAZONAS (AM)
{ city: "Itacoatiara",  uf: "AM", lat: -3.1386, lng: -58.4440 },
{ city: "Parintins",    uf: "AM", lat: -2.6283, lng: -56.7358 },
{ city: "Manacapuru",   uf: "AM", lat: -3.2996, lng: -60.6205 },
{ city: "Coari",        uf: "AM", lat: -4.0850, lng: -63.1410 },
{ city: "Tefé",         uf: "AM", lat: -3.3540, lng: -64.7190 },

// --- AMAPÁ (AP)
{ city: "Macapá",       uf: "AP", lat:  0.0355, lng: -51.0705 },
{ city: "Santana",      uf: "AP", lat: -0.0450, lng: -51.1810 },

// --- RORAIMA (RR)
{ city: "Boa Vista",    uf: "RR", lat:  2.8235, lng: -60.6758 },
// { city: "Caracaraí", uf: "RR", lat:  1.8260, lng: -61.1300 }, // opcional

// --- ACRE (AC)
{ city: "Rio Branco",   uf: "AC", lat: -9.9747, lng: -67.8101 },
{ city: "Cruzeiro do Sul", uf: "AC", lat: -7.6276, lng: -72.6731 },

// --- RONDÔNIA (RO)
{ city: "Porto Velho",  uf: "RO", lat: -8.7608, lng: -63.8999 },
{ city: "Ji-Paraná",    uf: "RO", lat: -10.8770, lng: -61.9530 },
{ city: "Ariquemes",    uf: "RO", lat: -9.9130, lng: -63.0400 },
{ city: "Vilhena",      uf: "RO", lat: -12.7400, lng: -60.1450 },

// --- TOCANTINS (TO)
{ city: "Palmas",       uf: "TO", lat: -10.1840, lng: -48.3336 },
{ city: "Araguaína",    uf: "TO", lat:  -7.1920, lng: -48.2070 },
{ city: "Gurupi",       uf: "TO", lat: -11.7290, lng: -49.0680 },

// --- MARANHÃO (MA) (fronteira Norte/Nordeste, útil para conexões)
{ city: "Imperatriz",   uf: "MA", lat: -5.5185, lng: -47.4777 },
];

/* ==== Handler ==== */
export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const origin_lat = Number(u.searchParams.get("origin_lat"));
  const origin_lng = Number(u.searchParams.get("origin_lng"));
  const days = Number(u.searchParams.get("days") ?? 14);
  const max = Number(u.searchParams.get("max") ?? 8);
  const radiusKm = Number(u.searchParams.get("radius_km") ?? 600); // raio para “próximos”
  const minGapKm = 30; // evita sugerir a própria cidade

  if (!Number.isFinite(origin_lat) || !Number.isFinite(origin_lng)) {
    return NextResponse.json({ error: "origin_lat/origin_lng required" }, { status: 400 });
  }

  // ordena candidatos por distância e filtra pelo raio
  const ranked = CANDIDATES
    .map((c) => ({ c, d: haversineKm(origin_lat, origin_lng, c.lat, c.lng) }))
    .filter(({ d }) => d > minGapKm && d <= radiusKm)
    .sort((a, b) => a.d - b.d)
    .map(({ c }) => c);

  // se nada cair no raio, relaxa e pega os mais próximos (fallback)
  const shortlist = ranked.length ? ranked : CANDIDATES
    .map((c) => ({ c, d: haversineKm(origin_lat, origin_lng, c.lat, c.lng) }))
    .filter(({ d }) => d > minGapKm)
    .sort((a, b) => a.d - b.d)
    .map(({ c }) => c)
    .slice(0, 20);

  const results = await Promise.all(shortlist.map((d) => minPriceByCoords(origin_lat, origin_lng, d, days)));
  const items = (results.filter((x): x is PopularItem => x !== null))
    .sort((a, b) => a.fromCents - b.fromCents)
    .slice(0, max);

  return NextResponse.json({ items });
}
