// apps/web/src/lib/viop-types-categorias.ts

export interface CategoriaCorridaItem {
  categoriaId: number;
  descCategoria: string;
  disponibilidadeCota: number; // 🔥 CAMPO CRÍTICO!
  gratuidadeCrianca: boolean;
  estudante: boolean;
  idoso: boolean;
  importeTarifa: number;
  importePedagio: number;
  importeSeguro: number;
  importeTaxaEmbarque: number;
  vendeApi: boolean;
}

export interface ConsultaCategoriasRequest {
  origem: number;
  destino: number;
  data: string;
  servico: number;
}












