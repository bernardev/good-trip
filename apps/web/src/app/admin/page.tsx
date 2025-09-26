export default function AdminHome() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
      <h1 className="text-2xl font-semibold">Bem-vindo 👋</h1>
      <p className="mt-1 text-white/70">
        Use o menu à esquerda para gerenciar Banner, Header, Footer e SEO.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold">Status</h2>
          <p className="text-sm text-white/70">Site online e saudável.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold">Últimas ações</h2>
          <p className="text-sm text-white/70">Nenhuma alteração recente.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold">Próximos passos</h2>
          <p className="text-sm text-white/70">Conectar armazenamento (Edge Config/Blob).</p>
        </div>
      </div>
    </section>
  );
}
