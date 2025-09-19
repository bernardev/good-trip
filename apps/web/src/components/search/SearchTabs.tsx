"use client";

import { useState } from "react";
import DistribusionWidgetIframe from "@/components/distribusion/DistribusionWidgetIframe";

const TABS = [{ id: "bus", label: "Ônibus" }];

export default function SearchTabs() {
  const [active] = useState("bus");
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`rounded-full px-4 h-9 text-sm transition ${
              active === t.id ? "bg-accent text-ink" : "bg-cloud/40 text-ink/70 hover:bg-cloud/60"
            }`}
            aria-current={active === t.id}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <DistribusionWidgetIframe className="bg-white/70" />
      </div>
    </div>
  );
}
