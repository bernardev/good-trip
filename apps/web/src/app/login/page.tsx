"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function Page() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  return (
    <form onSubmit={async e=>{e.preventDefault(); await signIn("credentials",{ email, password, callbackUrl: "/admin" });}} className="max-w-sm mx-auto p-6 space-y-3">
      <input className="border w-full p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border w-full p-2" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="w-full border p-2">Entrar</button>
    </form>
  );
}
