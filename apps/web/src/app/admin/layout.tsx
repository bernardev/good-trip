import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { ReactNode } from "react";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import SignOutButton from "@/components/admin/SignOutButton";

export const metadata = { title: "Admin — GoodTrip" };

const NAV = [
  { href: "/admin",         label: "Dashboard" },
  { href: "/admin/reemitir", label: "Reemitir" },
  { href: "/admin/banner",  label: "Banner" },
  { href: "/admin/offers",  label: "Ofertas" }, // << adicionado
  { href: "/admin/header",  label: "Header" },
  { href: "/admin/footer",  label: "Footer" },
  { href: "/admin/seo",     label: "SEO" },
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;
  if (!isAdmin) redirect("/login?callbackUrl=/admin");

  const adminName = session?.user?.name ?? "Admin";

  return (
    <div className="min-h-[100dvh] bg-navy text-white grid grid-cols-[260px_1fr]">
      {/* SIDEBAR */}
      <aside className="sticky top-0 h-[100dvh] border-r border-white/10 bg-gradient-to-b from-navy to-primary/20 px-4 py-5">
        <div className="mb-4">
          <div className="text-xl font-extrabold tracking-tight">GoodTrip</div>
          <div className="text-xs text-white/70">Painel</div>
        </div>

        <AdminNav items={NAV} />

        <div className="my-2 h-px bg-white/10" />
        <div className="flex items-center gap-2 px-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-white/80 truncate" title={adminName}>
            {adminName}
          </span>
        </div>

        <div className="mt-3 px-2">
          <SignOutButton className="w-full rounded-xl px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition" />
        </div>

        <div className="mt-6 text-[11px] text-white/60">v1 • Somente administradores</div>
      </aside>

      {/* MAIN */}
      <main className="min-w-0">
        <header className="sticky top-0 z-10 backdrop-blur bg-navy/60 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-5 h-14 flex items-center justify-between">
            <span className="text-sm text-white/80">Admin / Dashboard</span>
            <Link href="/" className="text-xs text-white/60 hover:text-white/80">Voltar ao site</Link>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-6">{children}</div>
      </main>
    </div>
  );
}
