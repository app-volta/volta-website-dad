import type { Material } from "./material";

/**
 * Materiais que uma cooperativa pode receber. Vão além dos quatro que a IA
 * classifica: papel misto, óleo e orgânico só existem do lado da cooperativa.
 */
export type MaterialAceito = Material | "papel_misto" | "oleo" | "organico";

/** Opções do cadastro, na ordem em que aparecem no formulário. */
export const MATERIAIS_CADASTRO: readonly MaterialAceito[] = [
  "papelao",
  "plastico",
  "metal",
  "vidro",
  "oleo",
  "organico",
] as const;

export const ROTULOS_MATERIAL_ACEITO: Readonly<Record<MaterialAceito, string>> =
  {
    papelao: "Papelão",
    plastico: "Plástico",
    metal: "Metal",
    vidro: "Vidro",
    papel_misto: "Papel misto",
    oleo: "Óleo",
    organico: "Orgânico",
  };

export type SituacaoCooperativa = "ativa" | "em_homologacao";

/** Posição ilustrativa no mapa, em % da largura e da altura. */
export interface PosicaoMapa {
  readonly x: number;
  readonly y: number;
}

export interface Cooperativa {
  readonly id: string;
  readonly nome: string;
  readonly cnpj: string;
  readonly cidade: string;
  readonly estado: string;
  readonly materiaisAceitos: readonly MaterialAceito[];
  /** Os dados de contato ficam nulos até a cooperativa ser homologada. */
  readonly contato: string | null;
  readonly telefone: string | null;
  readonly email: string | null;
  readonly distanciaKm: number;
  /** Nota de 0 a 5. Fica nula enquanto a cooperativa está em homologação. */
  readonly avaliacao: number | null;
  readonly situacao: SituacaoCooperativa;
  /** Parceira do grupo J&F, que ganha o selo no painel. */
  readonly parceiraGrupo: boolean;
  readonly capacidadeMesKg: number;
  /** Parte da capacidade do mês já comprometida com ocorrências. */
  readonly usadoMesKg: number;
  /** Data (AAAA-MM-DD) até a qual a licença é válida; nula sem licença. */
  readonly licencaValidaAte: string | null;
  /** Nome do PDF da licença enviado para análise, quando há. */
  readonly licencaDocumento: string | null;
  /** Volume destinado nos últimos cinco meses, do mais antigo ao mais recente. */
  readonly volumeMensalKg: readonly number[];
  /** Ilustrativo: a API real deve devolver latitude e longitude. */
  readonly posicaoMapa: PosicaoMapa;
  readonly logoUrl?: string;
}

export interface NovaCooperativa {
  readonly nome: string;
  readonly cnpj: string;
  readonly materiais: readonly MaterialAceito[];
  readonly licenca: File | null;
}
