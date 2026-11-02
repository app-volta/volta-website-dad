import type { ReactNode } from "react";

import { GraficoBarras } from "../../../components/GraficoBarras";
import type { OcorrenciasDoSetor, PeriodoRelatorio } from "../../../types/relatorio";
import { TEXTO_PERIODO } from "../../../utils/relatorio";

function textoDoValor(valor: number): string {
  return `${valor.toLocaleString("pt-BR")} ${valor === 1 ? "ocorrência" : "ocorrências"}`;
}

interface OcorrenciasPorSetorProps {
  readonly periodo: PeriodoRelatorio;
  readonly setores: readonly OcorrenciasDoSetor[];
}

/** Gráfico de barras com quantas ocorrências cada setor registrou no período. */
export function OcorrenciasPorSetor({
  periodo,
  setores,
}: OcorrenciasPorSetorProps): ReactNode {
  const total = setores.reduce((soma, setor) => soma + setor.ocorrencias, 0);

  return (
    <section className="rel__cartao" aria-labelledby="rel-ocorrencias-setor">
      <h2 id="rel-ocorrencias-setor" className="rel__cartao-titulo">
        Ocorrências por setor {TEXTO_PERIODO[periodo]}
      </h2>
      <p className="rel__subtitulo">{textoDoValor(total)} no total</p>
      <GraficoBarras
        direcao="linhas"
        rotulo="Ocorrências registradas por setor"
        formatarValor={textoDoValor}
        formatarRotulo={(valor) => valor.toLocaleString("pt-BR")}
        barras={setores.map((setor) => ({
          chave: setor.nome,
          rotulo: setor.nome,
          valor: setor.ocorrencias,
        }))}
      />
    </section>
  );
}
