// types/viop-checkout.ts
export type CategoriaRegras = {
  exigirNome: boolean; exigirDocumento: boolean; exigirTelefone: boolean;
  exigirDataNascimento: boolean; exigirEndereco: boolean; exigirEmail: boolean;
  clientePcd: boolean;
};

export type IdentificacaoForm = {
  passageiros: Array<{
    nome: string;
    documento: string;
    tipoDocumento?: 'RG'|'CPF'|'CNPJ'|'PASSAPORTE';
    telefone?: string;
    email?: string;
    nascimento?: string; // YYYY-MM-DD
    endereco?: { logradouro:string; numero:string; cidade:string; uf:string; cep:string };
    pcd?: boolean;
  }>;
  pagamento?: {
    idForma?: number;   // se usar buscarFormasPagamento
    descricao?: string; // "Crédito", "PIX", etc.
    cartao?: { numero:string; nome:string; validadeMM:string; validadeAA:string; cvv:string; parcelas?:number };
  };
};
