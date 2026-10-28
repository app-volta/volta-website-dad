import type { Material } from "./material";

export type NivelContaminacao = "baixa" | "media" | "alta";

/**
 * Análise da IA sobre uma ocorrência. A volta-api devolve o nível de
 * contaminação e as recomendações, mas não informa a confiança, e o tipo de
 * resíduo pode cair fora das quatro categorias do app. Por isso `material` e
 * `confianca` aceitam null.
 */
export interface ClassificacaoIA {
  readonly material: Material | null;
  readonly confianca: number | null;
  readonly contaminacao?: NivelContaminacao;
  readonly recomendacao: string;
  /** Texto completo do relatório, quando a IA da API o gerou. */
  readonly relatorio?: string;
  /** Tipo de resíduo como a IA descreveu ("Papelão contaminado"). */
  readonly tipoDetectado?: string;
  /** Tipo do catálogo da volta-api que vale para esta análise (a IA ou a pessoa escolheu). */
  readonly tipoResiduoId?: string;
  /** Peso estimado em kg; null quando a foto não tem escala ou referência. */
  readonly pesoEstimadoKg?: number | null;
  /** Quantidade de volumes (caixas, fardos), quando a fonte informa. */
  readonly unidades?: number | null;
  /** A IA pede revisão do responsável antes de agir. */
  readonly exigeValidacao?: boolean;
  readonly analisadaEm: string;
}

/** Tipo de resíduo que a pessoa pode escolher ao conferir a análise da foto. */
export interface OpcaoTipoResiduo {
  /** Id do tipo na volta-api; no mock, o próprio material. */
  readonly valor: string;
  readonly rotulo: string;
  readonly material: Material | null;
}

/** Classificação com todos os campos preenchidos, como o mock local entrega. */
export type ClassificacaoCompleta = ClassificacaoIA & {
  readonly material: Material;
  readonly confianca: number;
};
