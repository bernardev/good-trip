// apps/web/hooks/useSettings.ts
import { useEffect, useState } from "react";
import type { Settings } from "@/../types/settings";

export function useSettings(): { settings: Settings | null; loading: boolean } {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/settings", { cache: "no-store" });
        const s: Settings = await r.json();
        setSettings(s);
      } finally { setLoading(false); }
    })();
  }, []);
  return { settings, loading };
}
