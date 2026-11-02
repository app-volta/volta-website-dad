import type {
  Ocorrencia,
  PrioridadeOcorrencia,
  StatusOcorrencia,
} from "../types/ocorrencia";
import { formatarDataHora } from "./formatacao";

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

/**
 * Quem aprovou ou recusou e quando, numa frase: "Aprovada por Ana Souza em
 * 02/11/2026, 14:30". Para a pessoa logada diz "por você"; sem o nome, que a API
 * não devolve, cita só a data. Nulo quando não há data da decisão (ainda aguarda,
 * foi encaminhada ou foi decidida antes de a API guardar isso).
 */
export function descreverRevisao(
  ocorrencia: Ocorrencia,
  usuarioId: string | undefined,
): string | null {
  if (!ocorrencia.revisadaEm) return null;
  const categoria = categoriaDe(ocorrencia.status);
  if (categoria !== "aprovadas" && categoria !== "recusadas") return null;
  const acao = categoria === "recusadas" ? "Recusada" : "Aprovada";
  const quem =
    usuarioId !== undefined && ocorrencia.revisadaPor === usuarioId
      ? "você"
      : ocorrencia.revisadaPorNome;
  return `${acao}${quem ? ` por ${quem}` : ""} em ${formatarDataHora(ocorrencia.revisadaEm)}`;
}
