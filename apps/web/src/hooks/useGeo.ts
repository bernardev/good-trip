import { useEffect, useState } from "react";

export type Geo = { lat: number; lng: number; source: "gps" | "ip" } | null;

export function useGeo(timeoutMs = 3500): Geo {
  const [geo, setGeo] = useState<Geo>(null);

  useEffect(() => {
    let done = false;

    const setIfAlive = (g: Geo) => { if (!done) setGeo(g); };

    if ("geolocation" in navigator) {
      const t = setTimeout(() => ipFallback().then(setIfAlive).catch(() => setIfAlive(null)), timeoutMs);

      navigator.geolocation.getCurrentPosition(
        (pos) => { clearTimeout(t); setIfAlive({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: "gps" }); },
        () => { clearTimeout(t); ipFallback().then(setIfAlive).catch(() => setIfAlive(null)); },
        { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60_000 }
      );

      return () => { done = true; clearTimeout(t); };
    }

    ipFallback().then(setIfAlive).catch(() => setIfAlive(null));
    return () => { done = true; };
  }, [timeoutMs]);

  return geo;
}

async function ipFallback(): Promise<Geo> {
  // use /api/ip-geo server-side se preferir
  const url = (process.env.NEXT_PUBLIC_IP_GEO_URL as string | undefined) ?? "https://ipapi.co/json/";
  const res = await fetch(url);
  if (!res.ok) return null;
  const j: { latitude?: number; longitude?: number; lat?: number; lon?: number; lng?: number } = await res.json();
  const lat = typeof j.latitude === "number" ? j.latitude : typeof j.lat === "number" ? j.lat : undefined;
  const lngCand = j.longitude ?? j.lon ?? j.lng;
  const lng = typeof lngCand === "number" ? lngCand : undefined;
  if (lat === undefined || lng === undefined) return null;
  return { lat, lng, source: "ip" };
}
