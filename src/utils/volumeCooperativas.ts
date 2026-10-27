import type { ColetaApi } from "../types/api";
import type { Ocorrencia } from "../types/ocorrencia";
import { instanteUtc } from "./datas";
import { inicioDoMes } from "./painel";

/** Quantos meses fechados o gráfico do painel da cooperativa mostra. */
export const MESES_DO_GRAFICO = 5;

export interface VolumeDaCooperativa {
  /** Peso das coletas do mês atual que não foram canceladas. */
  readonly usadoMesKg: number;
  /** Peso das coletas concluídas nos últimos meses fechados, do mais antigo ao mais recente. */
  readonly volumeMensalKg: readonly number[];
}

const VAZIO: VolumeDaCooperativa = {
  usadoMesKg: 0,
  volumeMensalKg: Array.from({ length: MESES_DO_GRAFICO }, () => 0),
};

/**
 * Volume por cooperativa a partir das coletas. A coleta não guarda peso: vale o
 * peso estimado da ocorrência que a originou (zero quando a IA não estimou).
 */
export function volumesPorCooperativa(
  coletas: readonly ColetaApi[],
  ocorrencias: readonly Ocorrencia[],
  agora: Date = new Date(),
): ReadonlyMap<string, VolumeDaCooperativa> {
  const pesoDaOcorrencia = new Map(ocorrencias.map((o) => [o.id, o.pesoKg]));
  const inicioAtual = inicioDoMes(agora, 0);
  const inicioDosMeses = Array.from({ length: MESES_DO_GRAFICO }, (_, indice) =>
    inicioDoMes(agora, indice - MESES_DO_GRAFICO),
  );

  const acumulado = new Map<string, { usado: number; meses: number[] }>();
  for (const coleta of coletas) {
    if (coleta.currentStatus === "CANCELED") continue;
    const peso = pesoDaOcorrencia.get(coleta.incidentId) ?? 0;
    const solicitada = new Date(instanteUtc(coleta.requestedAt)).getTime();
    const atual = acumulado.get(coleta.cooperativeId) ?? {
      usado: 0,
      meses: Array.from({ length: MESES_DO_GRAFICO }, () => 0),
    };

    if (solicitada >= inicioAtual) {
      atual.usado += peso;
    } else if (coleta.currentStatus === "COMPLETED") {
      const indice = inicioDosMeses.findLastIndex((inicio) => solicitada >= inicio);
      if (indice >= 0) atual.meses[indice] += peso;
    }
    acumulado.set(coleta.cooperativeId, atual);
  }

  return new Map(
    [...acumulado].map(([id, dados]) => [
      id,
      {
        usadoMesKg: Math.round(dados.usado),
        volumeMensalKg: dados.meses.map(Math.round),
      },
    ]),
  );
}

export function volumeDaCooperativa(
  volumes: ReadonlyMap<string, VolumeDaCooperativa>,
  id: string,
): VolumeDaCooperativa {
  return volumes.get(id) ?? VAZIO;
}
