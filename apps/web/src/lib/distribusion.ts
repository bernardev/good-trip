export type RetailerSearchParams = Record<string, string | number | boolean | undefined>;

export function buildURL(path: string, params: RetailerSearchParams = {}): string {
  const base = process.env.DISTRIBUSION_BASE_URL ?? "https://api.distribusion.com/retailers/v4";
  const partner = process.env.NEXT_PUBLIC_DISTRIBUSION_PARTNER ?? "814999";

  const url = new URL(path.replace(/^\//, ""), base.endsWith("/") ? base : `${base}/`);
  url.searchParams.set("retailer_partner_number", String(partner));
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  return url.toString();
}

export async function retailerGET<T>(path: string, params?: RetailerSearchParams): Promise<T> {
  const res = await fetch(buildURL(path, params), { method: "GET", headers: { "Content-Type": "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Distribusion GET ${path} ${res.status}`);
  return (await res.json()) as T;
}

export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "unknown_error";
}
