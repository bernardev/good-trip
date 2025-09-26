"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

export default function AdminNav({ items }: { items: readonly Item[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((i) => {
        const active = pathname === i.href || pathname.startsWith(i.href + "/");
        return (
          <Link
            key={i.href}
            href={i.href}
            className={[
              "rounded-xl px-3 py-2 text-sm transition",
              active ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
