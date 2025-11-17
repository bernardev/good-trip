export type ViopBookingMeta = {
  servico: string;
  origemId: string;
  destinoId: string;
  data: string;
  assentos: string[]; // ["02","04"]
};

export type PassengerInfo = {
  nome: string;
  sobrenome: string;
  documentoTipo: 'CPF' | 'RG' | 'PASSAPORTE';
  documentoNumero: string;
  email: string;
};

export type CreatePaymentBody = {
  amount: number;              // total em BRL
  title: string;               // ex: "Passagem VIOP Curitiba → Floripa"
  quantity?: number;           // default 1
  payer: PassengerInfo;
  booking: ViopBookingMeta;    // metadados para pós-pagamento
  successUrl?: string;         // override (opcional)
  failureUrl?: string;         // override (opcional)
  pendingUrl?: string;         // override (opcional)
};

export type CreatePaymentResponse = {
  ok: true;
  preferenceId: string;
  initPoint: string;       // URL de redirecionamento
  sandboxInitPoint?: string;
} | {
  ok: false;
  error: string;
};
