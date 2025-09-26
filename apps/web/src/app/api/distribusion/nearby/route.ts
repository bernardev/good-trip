import { NextRequest, NextResponse } from "next/server";

type ReverseGeoAddress = {
  city?: string;
  town?: string;
  village?: string;
  state?: string;
};

type ReverseGeoResp = {
  address?: ReverseGeoAddress;
};

async function reverseGeocode(lat: string, lng: string): Promise<{ city?: string; uf?: string } | null> {
  const u = new URL("https://nominatim.openstreetmap.org/reverse");
  u.searchParams.set("format", "jsonv2");
  u.searchParams.set("lat", lat);
  u.searchParams.set("lon", lng);

  const res = await fetch(u.toString(), {
    headers: { "User-Agent": "GoodTrip/1.0 (reverse-geocode)" },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const j = (await res.json()) as ReverseGeoResp;
  const city = j.address?.city ?? j.address?.town ?? j.address?.village;
  const uf = j.address?.state;
  return { city, uf };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat/lng required" }, { status: 400 });
  }

  const rev = await reverseGeocode(lat, lng);
  const label =
    rev?.city ? `${rev.city}${rev.uf ? `, ${rev.uf}` : ""}` : "Sua região";

  return NextResponse.json({
    origin_lat: Number(lat),
    origin_lng: Number(lng),
    label,
  });
}
