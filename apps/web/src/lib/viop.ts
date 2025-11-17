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

// ====== Tipos “RJ” (respostas brutas da API do parceiro) ======
type RjLocalidade = {
  id: number;
  cidade: string;
  sigla: string; // sigla da cidade/rodoviária
  uf: string;
  empresas: string;
};

// Serviço/corrida (campos variam por parceiro; todos opcionais e tipados)
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
  data: string; // YYYY-MM-DD
};

type RjBuscaCorridaResponse = {
  origem: RjLocalidade;
  destino: RjLocalidade;
  data: string; // YYYY-MM-DD
  lsServicos: RjServico[];
};

type RjOnibus = {
  corridaId: string | number;
  poltronas: Array<{ numero: string | number; livre: boolean; classe?: string }>;
  servicos?: string[];
  veiculo?: string;
};

// --- Assentos por serviço (payload confirmado VIOP) ---
export type OnibusByServiceReq = {
  servico: string;   // id do serviço/corrida
  origem: string;    // ids numéricos em string
  destino: string;
  data: string;      // YYYY-MM-DD
};

type RjSeat = {
  numero?: string | number;
  poltrona?: string | number;
  assento?: string | number;
  livre?: boolean;
  status?: string;              // "LIVRE", "OCUPADA", etc.
  disponibilidade?: string;     // "DISPONIVEL", "INDISPONIVEL"
  flag?: string | number | boolean; // "S"/"N", 1/0, true/false (alguns gateways)
  classe?: string;
};

type RjOnibusByService = {
  corridaId?: string | number;
  seats?: { mapaPoltrona?: unknown }; // pode variar bastante
  poltronas?: unknown;                // pode ser array direto
  servicos?: string[];
  veiculo?: string;
};

// ====== ENV / base ======
const BASE = process.env.VIOP_BASE_URL ?? "";
const TENANT = process.env.VIOP_TENANT_ID ?? "";
const USER = process.env.VIOP_USER ?? "";
const PASS = process.env.VIOP_PASS ?? "";
const FORCE_MOCK = process.env.VIOP_FORCE_MOCK === "1";
const MOCK = FORCE_MOCK || !BASE || !TENANT || !USER || !PASS;

const AUTH =
  USER && PASS ? "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64") : "";

// ====== Low-level fetcher (genérico) ======
async function viopFetch<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-tenant-id": TENANT,
      ...(AUTH ? { authorization: AUTH } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`VIOP ${method} ${path} -> ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

// ====== Endpoints (paths reais + placeholders) ======
const Path = {
  localidade: {
    origem: () => `/localidade/buscaOrigem`, // GET
    destino: (origemId: string | number) => `/localidade/buscaDestino/${origemId}`, // GET
  },
  consultacorrida: {
    buscar: () => `/consultacorrida/buscaCorrida`, // POST
  },
  consultaonibus: {
    buscar: () => `/consultaonibus/buscaOnibus`, // POST
  },
  venda: {
    bloquear: `/viacaoouroprata/bloquearPoltrona`,
    confirmar: `/viacaoouroprata/confirmarVenda`,
  },
} as const;

// ====== Mocks (tipados) ======
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

// ====== Adapters (RJ -> internos) ======
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
      ? Math.max(
          0,
          Math.round(
            (new Date(chegada).getTime() - new Date(partida).getTime()) / 60000
          )
        )
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

// ====== Helpers ======
function parseCorridasFromUnknown(u: unknown): RjServico[] {
  // shape oficial { origem, destino, data, lsServicos: [...] }
  if (
    typeof u === "object" &&
    u !== null &&
    Array.isArray((u as RjBuscaCorridaResponse).lsServicos)
  ) {
    return (u as RjBuscaCorridaResponse).lsServicos;
  }

  // alguns parceiros retornam diretamente um array de serviços
  if (Array.isArray(u)) {
    return u as RjServico[];
  }

  // wrappers comuns
  if (typeof u === "object" && u !== null) {
    const o = u as Record<string, unknown>;
    const keys: ReadonlyArray<keyof typeof o> = [
      "servicos",
      "corridas",
      "lista",
      "list",
      "data",
      "result",
      "results",
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

// ==== Utilitários de parsing seguro (sem any) para seats ====
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
function isSeatCandidate(x: unknown): x is RjSeat {
  if (!isRecord(x)) return false;
  const hasNumero =
    "numero" in x || "assento" in x || "poltrona" in x;
  const hasEstado =
    "livre" in x || "status" in x || "disponibilidade" in x || "flag" in x;
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

// ====== API pública (fortemente tipada) ======
export const Viop = {
  // ORIGENS: GET /localidade/buscaOrigem (filtramos por q no servidor)
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

  // DESTINOS: GET /localidade/buscaDestino/{origemId}
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

  // CORRIDAS: POST /consultacorrida/buscaCorrida – payload confirmado: { origem, destino, data }
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
    const ymd = `${y}-${m}-${day}`; // YYYY-MM-DD

    const body: RjBuscaCorridaRequest = {
      origem: Number(origemId),
      destino: Number(destinoId),
      data: ymd,
    };

    const res = await fetch(`${BASE}${Path.consultacorrida.buscar()}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": TENANT,
        ...(AUTH ? { authorization: AUTH } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (res.status === 204) return [];

    const txt = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(`buscaCorrida falhou: ${res.status} ${txt}`);
    }

    let parsed: unknown = {};
    try {
      parsed = txt ? (JSON.parse(txt) as unknown) : {};
    } catch {
      parsed = {};
    }

    const servicos = parseCorridasFromUnknown(parsed);
    return servicos.map(mapRjServicoToCorrida);
  },

  // ÔNIBUS (assentos): POST /consultaonibus/buscaOnibus (payload legado por corridaId)
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

  // ÔNIBUS (assentos) — payload específico VIOP: { servico, origem, destino, data }
  async buscarOnibusByService(req: OnibusByServiceReq): Promise<Onibus> {
    if (MOCK) return Promise.resolve(mockOnibus(req.servico));
    const data = await viopFetch<RjOnibusByService>(Path.consultaonibus.buscar(), "POST", req);

    // --- extrator robusto de seats (sem any) ---
    const pickSeats = (d: RjOnibusByService): RjSeat[] => {
      // 1) array direto em seats.mapaPoltrona
      if (d.seats && isRecord(d.seats)) {
        const mp = d.seats.mapaPoltrona;
        if (Array.isArray(mp)) return mp.filter(isSeatCandidate);
        if (isRecord(mp)) {
          // pode vir como { linhas:[{colunas:[...]}, ...] } etc.
          const out1: RjSeat[] = [];
          collectSeatsDeep(mp, out1);
          if (out1.length) return out1;
        }
      }

      // 2) array direto em poltronas
      if (Array.isArray(d.poltronas)) {
        return d.poltronas.filter(isSeatCandidate);
      }
      if (isRecord(d.poltronas)) {
        const out2: RjSeat[] = [];
        collectSeatsDeep(d.poltronas, out2);
        if (out2.length) return out2;
      }

      // 3) varredura completa em d
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

  // BLOQUEAR (placeholders até validar com o parceiro)
  async bloquearPoltrona(payload: BloquearPoltronaReq): Promise<BloquearPoltronaRes> {
    if (MOCK) return Promise.resolve(mockBloquear());
    return viopFetch<BloquearPoltronaRes>(Path.venda.bloquear, "POST", payload);
  },

  // CONFIRMAR (placeholders até validar com o parceiro)
  async confirmarVenda(payload: ConfirmarVendaReq): Promise<ConfirmarVendaRes> {
    if (MOCK) return Promise.resolve(mockConfirmar());
    return viopFetch<ConfirmarVendaRes>(Path.venda.confirmar, "POST", payload);
  },
};

export { Path as ViopPath };
