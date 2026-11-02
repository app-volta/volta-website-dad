import type { Ocorrencia } from "../types/ocorrencia";

const DIA_MS = 86_400_000;
const DIAS_DA_SEMANA = 7;

/**
 * Quantas ocorrências parecidas (mesmo título e mesmo setor) a unidade teve nos
 * últimos sete dias, até a própria ocorrência: ela conta, e as registradas depois
 * dela não.
 */
export function contarSemelhantesNaSemana(
  lista: readonly Ocorrencia[],
  ocorrencia: Ocorrencia,
  agora: number = Date.now(),
): number {
  const limite = agora - DIAS_DA_SEMANA * DIA_MS;
  return lista.filter(
    (item) =>
      item.titulo === ocorrencia.titulo &&
      item.localizacao.setor === ocorrencia.localizacao.setor &&
      new Date(item.criadaEm).getTime() >= limite &&
      item.criadaEm <= ocorrencia.criadaEm,
  ).length;
}
