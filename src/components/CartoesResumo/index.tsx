import type { ReactNode } from "react";

import { Icone } from "../Icone";
import type { NomeIcone } from "../Icone";
import "./styles.css";

export type TomResumo = "verde" | "azul" | "roxo" | "laranja" | "ambar";

export interface CartaoResumo {
  readonly rotulo: string;
  readonly valor: string;
  readonly unidade?: string;
  readonly icone: NomeIcone;
  readonly tom: TomResumo;
}

interface CartoesResumoProps {
  readonly cartoes: readonly CartaoResumo[];
  readonly rotulo: string;
}

/** Linha de indicadores do topo das telas de gestão: ícone, rótulo e valor. */
export function CartoesResumo({
  cartoes,
  rotulo,
}: CartoesResumoProps): ReactNode {
  return (
    <ul className="resumo" aria-label={rotulo}>
      {cartoes.map((cartao) => (
        <li key={cartao.rotulo} className="resumo__cartao">
          <div className="resumo__topo">
            <span
              className={`resumo__icone resumo__icone--${cartao.tom}`}
              aria-hidden="true"
            >
              <Icone nome={cartao.icone} tamanho={16} />
            </span>
            <span className="resumo__rotulo">{cartao.rotulo}</span>
          </div>
          <p className="resumo__valor">
            {cartao.valor}
            {cartao.unidade ? (
              <span className="resumo__unidade">{cartao.unidade}</span>
            ) : null}
          </p>
        </li>
      ))}
    </ul>
  );
}
