import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { Icone } from "../../../components/Icone";
import type { PeriodoRelatorio } from "../../../types/relatorio";
import "./styles.css";

/** Uma parte dos dados que o documento precisa, e se ela já chegou. */
export interface EtapaDoRelatorio {
  readonly rotulo: string;
  readonly pronta: boolean;
}

interface PreparandoRelatorioProps {
  readonly periodo: PeriodoRelatorio;
  readonly etapas: readonly EtapaDoRelatorio[];
}

const DO_PERIODO: Readonly<Record<PeriodoRelatorio, string>> = {
  mes: "do mês",
  trimestre: "do trimestre",
  ano: "do ano",
};

/** Depois disso a tela avisa que a espera está maior que o normal. */
const DEMORA_MS = 8000;

/**
 * O que a pessoa vê enquanto o documento não está pronto: o andamento de cada parte dos
 * dados e, ao fundo, o contorno das duas folhas A4 que vão aparecer.
 */
export function PreparandoRelatorio({ periodo, etapas }: PreparandoRelatorioProps): ReactNode {
  const [demorando, setDemorando] = useState(false);

  useEffect(() => {
    const relogio = window.setTimeout(() => setDemorando(true), DEMORA_MS);
    return () => window.clearTimeout(relogio);
  }, []);

  return (
    <section className="pgrs-preparando" aria-labelledby="pgrs-preparando-titulo">
      <div className="pgrs-preparando__cartao" role="status" aria-live="polite">
        <span className="pgrs-preparando__circulo" aria-hidden="true" />
        <div className="pgrs-preparando__conteudo">
          <h1 id="pgrs-preparando-titulo" className="pgrs-preparando__titulo">
            Montando o relatório {DO_PERIODO[periodo]}…
          </h1>
          <p className="pgrs-preparando__texto">
            Estamos reunindo os dados da unidade. O botão "Salvar como PDF" libera quando o
            documento estiver pronto.
          </p>
          <ul className="pgrs-preparando__etapas">
            {etapas.map((etapa) => (
              <li
                key={etapa.rotulo}
                className={`pgrs-preparando__etapa${etapa.pronta ? " pgrs-preparando__etapa--pronta" : ""}`}
              >
                <span className="pgrs-preparando__marca" aria-hidden="true">
                  {etapa.pronta ? <Icone nome="check" tamanho={12} /> : null}
                </span>
                {etapa.rotulo}
                <span className="sr-only">{etapa.pronta ? " (pronto)" : " (em andamento)"}</span>
              </li>
            ))}
          </ul>
          {demorando ? (
            <p className="pgrs-preparando__aviso">
              Está demorando mais que o normal. A conexão com o servidor pode estar lenta; a tela
              continua tentando.
            </p>
          ) : null}
        </div>
      </div>

      <div className="pgrs-preparando__folhas" aria-hidden="true">
        {[0, 1].map((numero) => (
          <div key={numero} className="pgrs-preparando__folha">
            <span className="pgrs-preparando__linha pgrs-preparando__linha--titulo" />
            <span className="pgrs-preparando__linha" />
            <span className="pgrs-preparando__linha" />
            <span className="pgrs-preparando__bloco" />
            <span className="pgrs-preparando__linha" />
            <span className="pgrs-preparando__linha pgrs-preparando__linha--curta" />
          </div>
        ))}
      </div>
    </section>
  );
}
