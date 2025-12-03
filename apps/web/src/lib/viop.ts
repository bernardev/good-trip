// apps/web/src/lib/viop.ts

// ====== Tipos internos (usados pela app) ======
export type Origem = { id: string; nome: string };
export type Destino = { id: string; nome: string };

export type Corrida = {
  id: string;
  dataPartida: string; // ISO
  dataChegada: string; // ISO
  operadora: string;
  duracaoMin: number;
  tarifaDesde: number;
};

export type Poltrona = { numero: string; livre: boolean; classe?: string };
export type Onibus = {
  corridaId: string;
  poltronas: Poltrona[];
  servicos?: string[];
  veiculo?: string;
};

export type BloquearPoltronaReq = {
  corridaId: string;
  assentos: string[];
  nome: string;
  documento: string;
};
export type BloquearPoltronaRes = {
  bloqueioId: string;
  expiresAt: string; // ISO
  total: number;
};

export type ConfirmarVendaReq = {
  bloqueioId: string;
  contato: { email: string; telefone: string };
};
export type ConfirmarVendaRes = {
  localizador: string;
  status: "CONFIRMADO" | "NEGADO";
  total: number;
};

// ====== Tipos "RJ" (respostas brutas da API do parceiro) ======
type RjLocalidade = {
  id: number;
  cidade: string;
  sigla: string;
  uf: string;
  empresas: string;
};

type RjServico = {
  servico?: string | number;
  id?: string | number;
  idServico?: string | number;
  idViagem?: string | number;
  codigo?: string | number;
  codigoServico?: string | number;
  dataPartida?: string;
  saida?: string;
  partida?: string;
  dtSaida?: string;
  horaSaida?: string;
  dataChegada?: string;
  chegada?: string;
  dtChegada?: string;
  horaChegada?: string;
  empresa?: string;
  operadora?: string;
  companhia?: string;
  duracaoMin?: number;
  duracao?: number;
  tarifaDesde?: number;
  precoDesde?: number;
  preco?: number;
  valor?: number;
  valorDesde?: number;
};

type RjBuscaCorridaRequest = {
  origem: number;
  destino: number;
  data: string;
};

type RjBuscaCorridaResponse = {
  origem: RjLocalidade;
  destino: RjLocalidade;
  data: string;
  lsServicos: RjServico[];
};

type RjOnibus = {
  corridaId: string | number;
  poltronas: Array<{ numero: string | number; livre: boolean; classe?: string }>;
  servicos?: string[];
  veiculo?: string;
};

export type OnibusByServiceReq = {
  servico: string;
  origem: string;
  destino: string;
  data: string;
};

type RjSeat = {
  numero?: string | number;
  poltrona?: string | number;
  assento?: string | number;
  livre?: boolean;
  status?: string;
  disponibilidade?: string;
  flag?: string | number | boolean;
  classe?: string;
};

type RjOnibusByService = {
  corridaId?: string | number;
  seats?: { mapaPoltrona?: unknown };
  poltronas?: unknown;
  servicos?: string[];
  veiculo?: string;
};

// ====== ENV / base ======
// 🔥 Proxy Vercel (região Brasil - gru1)
const BASE = "/api/viop-proxy";
const TENANT = "36906f34-b731-46bc-a19d-a6d8923ac2e7";
const USER = "GOODTRIPAPI";
const PASS = "@g1t2#";
const FORCE_MOCK = process.env.VIOP_FORCE_MOCK === "1";
const MOCK = FORCE_MOCK || !BASE || !TENANT || !USER || !PASS;

const AUTH = USER && PASS 
  ? "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64") 
  : "";

console.error("🔐 AUTH DEBUG:", {
  USER,
  PASS_LENGTH: PASS.length,
  AUTH_COMPLETO: AUTH,
  BASE64_DECODED: AUTH ? Buffer.from(AUTH.replace("Basic ", ""), "base64").toString() : "",
});

// ====== Low-level fetcher (genérico) ======
async function viopFetch<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<T> {
  console.error("=".repeat(50));
  console.error("🚀 VIOP FETCH");
  console.error("=".repeat(50));
  
  // Proxy Vercel: path como query parameter
  const url = `${BASE}?path=${encodeURIComponent(path)}`;
  
  const headers = {
    "content-type": "application/json",
  };

  console.error("📡 REQUEST:", {
    url,
    method,
    body: body ? JSON.stringify(body).substring(0, 200) : undefined,
  });

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
      cache: "no-store",
    };

    if (method === "POST" && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(url, fetchOptions);

    console.error("📥 RESPONSE:", {
      status: res.status,
      ok: res.ok,
      statusText: res.statusText,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("❌ ERRO:", text.substring(0, 500));
      throw new Error(`VIOP ${method} ${path} -> ${res.status} ${text}`);
    }
    
    const json = await res.json();
    console.error("✅ Sucesso!");
    return json as T;
    
  } catch (error) {
    console.error("💥 EXCEÇÃO:", error);
    throw error;
  }
}

// ====== Endpoints ======
const Path = {
  localidade: {
    origem: () => `/localidade/buscaOrigem`,
    destino: (origemId: string | number) => `/localidade/buscaDestino/${origemId}`,
  },
  consultacorrida: {
    buscar: () => `/consultacorrida/buscaCorrida`,
  },
  consultaonibus: {
    buscar: () => `/consultaonibus/buscaOnibus`,
  },
  venda: {
    bloquear: `/viacaoouroprata/bloquearPoltrona`,
    confirmar: `/viacaoouroprata/confirmarVenda`,
  },
} as const;

// ====== Mocks ======
function mockOrigens(q: string): Origem[] {
  const data: Origem[] = [
    { id: "CWB", nome: "Curitiba - PR" },
    { id: "GRU", nome: "Guarulhos - SP" },
  ];
  return q ? data.filter((o) => o.nome.toLowerCase().includes(q.toLowerCase())) : data;
}

function mockDestinos(): Destino[] {
  return [
    { id: "POA", nome: "Porto Alegre - RS" },
    { id: "FLN", nome: "Florianópolis - SC" },
  ];
}

function mockCorridas(): Corrida[] {
  const now = Date.now();
  return [
    {
      id: "run-1",
      dataPartida: new Date(now + 60 * 60 * 1000).toISOString(),
      dataChegada: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
      operadora: "VOP",
      duracaoMin: 180,
      tarifaDesde: 129.9,
    },
  ];
}

function mockOnibus(corridaId: string): Onibus {
  const poltronas: Poltrona[] = Array.from({ length: 20 }).map((_, i) => ({
    numero: String(i + 1),
    livre: i % 3 !== 0,
  }));
  return { corridaId, poltronas };
}

function mockBloquear(): BloquearPoltronaRes {
  return {
    bloqueioId: "blk_123",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    total: 129.9,
  };
}

function mockConfirmar(): ConfirmarVendaRes {
  return { localizador: "ABC123", status: "CONFIRMADO", total: 129.9 };
}

// ====== Adapters ======
function mapLocalidadeToOrigem(x: RjLocalidade): Origem {
  return { id: String(x.id), nome: `${x.cidade} - ${x.uf}` };
}
function mapLocalidadeToDestino(x: RjLocalidade): Destino {
  return { id: String(x.id), nome: `${x.cidade} - ${x.uf}` };
}

function mapRjServicoToCorrida(x: RjServico): Corrida {
  const idCandidate =
    x.servico ?? x.id ?? x.idServico ?? x.idViagem ?? x.codigo ?? x.codigoServico ?? "indefinido";
  const partida =
    x.dataPartida ?? x.saida ?? x.partida ?? x.dtSaida ?? x.horaSaida ?? null;
  const chegada =
    x.dataChegada ?? x.chegada ?? x.dtChegada ?? x.horaChegada ?? null;
  const empresa = x.empresa ?? x.operadora ?? x.companhia ?? "VOP";
  const duracaoMinCalc =
    typeof x.duracaoMin === "number"
      ? x.duracaoMin
      : typeof x.duracao === "number"
      ? x.duracao
      : partida && chegada
      ? Math.max(0, Math.round((new Date(chegada).getTime() - new Date(partida).getTime()) / 60000))
      : 0;
  const tarifaRaw =
    x.tarifaDesde ?? x.precoDesde ?? x.preco ?? x.valor ?? x.valorDesde ?? 0;
  const tarifaNum =
    typeof tarifaRaw === "number" ? tarifaRaw : Number(String(tarifaRaw));
  return {
    id: String(idCandidate),
    dataPartida: partida ?? new Date().toISOString(),
    dataChegada: chegada ?? new Date().toISOString(),
    operadora: empresa,
    duracaoMin: duracaoMinCalc,
    tarifaDesde: Number.isFinite(tarifaNum) ? tarifaNum : 0,
  };
}

function parseCorridasFromUnknown(u: unknown): RjServico[] {
  if (
    typeof u === "object" &&
    u !== null &&
    Array.isArray((u as RjBuscaCorridaResponse).lsServicos)
  ) {
    return (u as RjBuscaCorridaResponse).lsServicos;
  }
  if (Array.isArray(u)) {
    return u as RjServico[];
  }
  if (typeof u === "object" && u !== null) {
    const o = u as Record<string, unknown>;
    const keys: ReadonlyArray<keyof typeof o> = [
      "servicos", "corridas", "lista", "list", "data", "result", "results",
    ];
    for (const k of keys) {
      const v = o[k];
      if (Array.isArray(v)) return v as RjServico[];
    }
  }
  return [];
}

function mapSeat(p: RjSeat): Poltrona {
  const n = p.numero ?? p.poltrona ?? p.assento ?? "";
  const token = String(p.status ?? p.disponibilidade ?? p.flag ?? "").toUpperCase();
  const livre =
    typeof p.livre === "boolean"
      ? p.livre
      : token === "LIVRE" ||
        token === "DISPONIVEL" ||
        token === "AVAILABLE" ||
        token === "S" ||
        token === "SIM" ||
        token === "Y" ||
        token === "TRUE" ||
        token === "1";
  return { numero: String(n), livre, classe: p.classe };
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
function isSeatCandidate(x: unknown): x is RjSeat {
  if (!isRecord(x)) return false;
  const hasNumero = "numero" in x || "assento" in x || "poltrona" in x;
  const hasEstado = "livre" in x || "status" in x || "disponibilidade" in x || "flag" in x;
  return hasNumero && hasEstado;
}
function collectSeatsDeep(x: unknown, out: RjSeat[]): void {
  if (Array.isArray(x)) {
    for (const it of x) collectSeatsDeep(it, out);
    return;
  }
  if (isSeatCandidate(x)) {
    out.push(x);
    return;
  }
  if (isRecord(x)) {
    for (const k of Object.keys(x)) {
      collectSeatsDeep(x[k], out);
    }
  }
}

// ====== API pública ======
export const Viop = {
  async buscarOrigens(q: string): Promise<Origem[]> {
    if (MOCK) return Promise.resolve(mockOrigens(q));
    const list = await viopFetch<RjLocalidade[]>(Path.localidade.origem());
    const mapped = list.map(mapLocalidadeToOrigem);
    if (!q) return mapped;
    const qn = q.toLowerCase();
    return mapped.filter(
      (o) => o.nome.toLowerCase().includes(qn) || o.id.toLowerCase().startsWith(qn)
    );
  },

  async buscarDestinos(origemId: string, q: string): Promise<Destino[]> {
    if (MOCK) {
      const all: Destino[] = mockDestinos();
      const norm = (s: string) =>
        s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
      const acro = (s: string) => norm(s).split(/\s+/).map((w) => w[0]).join("");
      const qn = norm(q.trim());
      if (!qn) return all;
      return all.filter(
        (d) =>
          d.id.toLowerCase().startsWith(qn) ||
          norm(d.nome).includes(qn) ||
          acro(d.nome).startsWith(qn)
      );
    }
    const list = await viopFetch<RjLocalidade[]>(Path.localidade.destino(origemId));
    const mapped = list.map(mapLocalidadeToDestino);
    if (!q) return mapped;
    const qn = q.toLowerCase();
    return mapped.filter(
      (d) => d.nome.toLowerCase().includes(qn) || d.id.toLowerCase().startsWith(qn)
    );
  },

  async buscarCorridas(
    origemId: string,
    destinoId: string,
    dataIso: string
  ): Promise<Corrida[]> {
    if (MOCK) return Promise.resolve(mockCorridas());
    const d = new Date(dataIso);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const ymd = `${y}-${m}-${day}`;
    const body: RjBuscaCorridaRequest = {
      origem: Number(origemId),
      destino: Number(destinoId),
      data: ymd,
    };
    const res = await viopFetch<unknown>(Path.consultacorrida.buscar(), "POST", body);
    const servicos = parseCorridasFromUnknown(res);
    return servicos.map(mapRjServicoToCorrida);
  },

  async buscarOnibus(corridaId: string): Promise<Onibus> {
    if (MOCK) return Promise.resolve(mockOnibus(corridaId));
    const payload: { corridaId: string } = { corridaId };
    const data = await viopFetch<RjOnibus>(Path.consultaonibus.buscar(), "POST", payload);
    return {
      corridaId: String(data.corridaId),
      poltronas: (data.poltronas ?? []).map((p) => ({
        numero: String(p.numero),
        livre: Boolean(p.livre),
        classe: p.classe,
      })),
      servicos: data.servicos,
      veiculo: data.veiculo,
    };
  },

  async buscarOnibusByService(req: OnibusByServiceReq): Promise<Onibus> {
    if (MOCK) return Promise.resolve(mockOnibus(req.servico));
    const data = await viopFetch<RjOnibusByService>(Path.consultaonibus.buscar(), "POST", req);
    const pickSeats = (d: RjOnibusByService): RjSeat[] => {
      if (d.seats && isRecord(d.seats)) {
        const mp = d.seats.mapaPoltrona;
        if (Array.isArray(mp)) return mp.filter(isSeatCandidate);
        if (isRecord(mp)) {
          const out1: RjSeat[] = [];
          collectSeatsDeep(mp, out1);
          if (out1.length) return out1;
        }
      }
      if (Array.isArray(d.poltronas)) {
        return d.poltronas.filter(isSeatCandidate);
      }
      if (isRecord(d.poltronas)) {
        const out2: RjSeat[] = [];
        collectSeatsDeep(d.poltronas, out2);
        if (out2.length) return out2;
      }
      const out3: RjSeat[] = [];
      collectSeatsDeep(d, out3);
      return out3;
    };
    const rawSeats: RjSeat[] = pickSeats(data);
    return {
      corridaId: String(data.corridaId ?? req.servico),
      poltronas: rawSeats.map(mapSeat),
      servicos: data.servicos,
      veiculo: data.veiculo,
    };
  },

  async bloquearPoltrona(payload: BloquearPoltronaReq): Promise<BloquearPoltronaRes> {
    if (MOCK) return Promise.resolve(mockBloquear());
    return viopFetch<BloquearPoltronaRes>(Path.venda.bloquear, "POST", payload);
  },

  async confirmarVenda(payload: ConfirmarVendaReq): Promise<ConfirmarVendaRes> {
    if (MOCK) return Promise.resolve(mockConfirmar());
    return viopFetch<ConfirmarVendaRes>(Path.venda.confirmar, "POST", payload);
  },
};

export { Path as ViopPath };