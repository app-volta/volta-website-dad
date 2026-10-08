import type { ReactNode } from "react";

import { Icone } from "../../components/Icone";
import type { NomeIcone } from "../../components/Icone";
import type { ResumoCooperativas } from "../../utils/cooperativas";

interface CartoesResumoProps {
  readonly resumo: ResumoCooperativas;
}

interface Cartao {
  readonly rotulo: string;
  readonly valor: string;
  readonly unidade?: string;
  readonly icone: NomeIcone;
  readonly tom: "verde" | "azul" | "roxo" | "laranja";
}

export function CartoesResumo({ resumo }: CartoesResumoProps): ReactNode {
  const cartoes: readonly Cartao[] = [
    {
      rotulo: "Parcerias ativas",
      valor: String(resumo.ativas),
      icone: "ciclo",
      tom: "verde",
    },
    {
      rotulo: "Em homologação",
      valor: String(resumo.emHomologacao),
      icone: "relogio",
      tom: "azul",
    },
    {
      rotulo: "Destinado no trimestre",
      valor: resumo.destinadoTrimestreKg.toLocaleString("pt-BR"),
      unidade: "kg",
      icone: "caminhao",
      tom: "roxo",
    },
    {
      rotulo: "Licenças vencendo",
      valor: String(resumo.licencasVencendo),
      icone: "alerta",
      tom: "laranja",
    },
  ];

  return (
    <ul className="coops__kpis" aria-label="Resumo das cooperativas">
      {cartoes.map((cartao) => (
        <li key={cartao.rotulo} className="coops__kpi">
          <div className="coops__kpi-topo">
            <span
              className={`coops__kpi-icone coops__kpi-icone--${cartao.tom}`}
              aria-hidden="true"
            >
              <Icone nome={cartao.icone} tamanho={16} />
            </span>
            <span className="coops__kpi-rotulo">{cartao.rotulo}</span>
          </div>
          <p className="coops__kpi-valor">
            {cartao.valor}
            {cartao.unidade ? (
              <span className="coops__kpi-unidade">{cartao.unidade}</span>
            ) : null}
          </p>
        </li>
      ))}
    </ul>
  );
}
