"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={className ?? "rounded-xl px-3 py-2 text-sm hover:bg-white/10"}
      type="button"
    >
      Sair
    </button>
  );
}
