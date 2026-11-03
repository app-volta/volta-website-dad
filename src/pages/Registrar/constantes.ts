import type { NivelContaminacao } from "../../types/classificacao";
import type { OrigemDoPeso, Prioridade } from "./reducer";

export const PRIORIDADES: readonly {
  readonly valor: Prioridade;
  readonly rotulo: string;
}[] = [
  { valor: "alta", rotulo: "Alta" },
  { valor: "media", rotulo: "Média" },
  { valor: "baixa", rotulo: "Baixa" },
];

export const NIVEIS_DE_CONTAMINACAO: readonly {
  readonly valor: NivelContaminacao;
  readonly rotulo: string;
}[] = [
  { valor: "baixa", rotulo: "Baixa" },
  { valor: "media", rotulo: "Média" },
  { valor: "alta", rotulo: "Alta" },
];

export const DE_ONDE_VEM_O_PESO: Readonly<Record<OrigemDoPeso, string>> = {
  informado: "Informado por você",
  ia: "Estimado pela IA",
  nenhum: "A IA não conseguiu estimar pela foto",
};
