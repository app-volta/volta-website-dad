import type { ReactNode } from "react";

import { Icone } from "../../components/Icone";
import { Mascote } from "../../components/Mascote";
import type { PeriodoRelatorio } from "../../types/relatorio";
import { TEXTO_PERIODO } from "../../utils/relatorio";

interface CartaoPgrsProps {
  readonly periodo: PeriodoRelatorio;
  readonly gerando: boolean;
  readonly temUltimo: boolean;
  readonly aoGerar: () => void;
  readonly aoBaixarUltimo: () => void;
}

export function CartaoPgrs({
  periodo,
  gerando,
  temUltimo,
  aoGerar,
  aoBaixarUltimo,
}: CartaoPgrsProps): ReactNode {
  return (
    <section className="rel__pgrs" aria-labelledby="rel-pgrs-titulo">
      <svg
        className="rel__pgrs-seta"
        viewBox="0 0 226.493 235.874"
        fill="none"
        aria-hidden="true"
      >
        <g opacity="0.13">
          <path
            d="M201.701 123.282C201.552 141.723 195.641 159.655 184.794 174.568C173.947 189.481 158.707 200.629 141.209 206.45C123.711 212.272 104.831 212.475 87.2119 207.032C69.5926 201.589 54.1166 190.773 42.9507 176.096C31.7848 161.42 25.4882 143.62 24.9423 125.187C24.3965 106.754 29.6289 88.6123 39.9068 73.3012C50.1847 57.9901 64.9935 46.2766 82.2599 39.8006C99.5262 33.3247 118.386 32.4106 136.197 37.1863"
            stroke="white"
            strokeWidth="31.2"
            strokeLinecap="round"
          />
          <path
            d="M139.539 5.20016L174.179 46.8604L123.083 65.6155L139.539 5.20016Z"
            fill="white"
            stroke="white"
            strokeWidth="10.4"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      <div className="rel__pgrs-conteudo">
        <h3 id="rel-pgrs-titulo" className="rel__pgrs-titulo">
          Relatório PGRS {TEXTO_PERIODO[periodo]}
        </h3>
        <p className="rel__pgrs-texto">
          Consolida ocorrências aprovadas, destinação por cooperativa e
          evidências fotográficas — pronto pro órgão ambiental.
        </p>
        <div className="rel__pgrs-acoes">
          <button
            type="button"
            className="rel__pgrs-botao rel__pgrs-botao--claro"
            onClick={aoGerar}
            disabled={gerando}
          >
            <Icone nome="documento" tamanho={14} />
            {gerando ? "Gerando…" : "Gerar PGRS"}
          </button>
          <button
            type="button"
            className="rel__pgrs-botao rel__pgrs-botao--vidro"
            onClick={aoBaixarUltimo}
            disabled={!temUltimo || gerando}
            title={temUltimo ? undefined : "Gere um relatório para baixar o último"}
          >
            <Icone nome="download" tamanho={14} />
            Último
          </button>
        </div>
      </div>

      <div className="rel__pgrs-mascote" aria-hidden="true">
        <Mascote tamanho={79} altura={136} />
      </div>
    </section>
  );
}
