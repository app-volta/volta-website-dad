import type {
  PrioridadeOcorrencia,
  StatusOcorrencia,
} from "../types/ocorrencia";

export type CategoriaStatus =
  | "aguardando"
  | "aprovadas"
  | "encaminhadas"
  | "recusadas";

export const ROTULO_CATEGORIA: Readonly<Record<CategoriaStatus, string>> = {
  aguardando: "AGUARDANDO APROVAÇÃO",
  aprovadas: "APROVADA",
  encaminhadas: "ENCAMINHADA",
  recusadas: "RECUSADA",
};

export const ROTULO_PRIORIDADE: Readonly<Record<PrioridadeOcorrencia, string>> =
  {
    alta: "ALTA",
    media: "MÉDIA",
    baixa: "BAIXA",
  };

export function categoriaDe(status: StatusOcorrencia): CategoriaStatus {
  switch (status) {
    case "aguardando_classificacao":
    case "classificada":
      return "aguardando";
    case "aprovada":
    case "finalizada":
      return "aprovadas";
    case "encaminhada":
      return "encaminhadas";
    case "recusada":
      return "recusadas";
  }
}

export function aguardaAprovacao(status: StatusOcorrencia): boolean {
  return categoriaDe(status) === "aguardando";
}
