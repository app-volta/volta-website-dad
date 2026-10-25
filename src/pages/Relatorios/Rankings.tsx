import type { ReactNode } from "react";

import type {
  DestinacaoCooperativa,
  GeracaoPorSetor,
} from "../../types/relatorio";
import { formatarKg } from "../../utils/formatacao";

/** A posição no ranking e a cooperativa seguem a mesma ordem de cores do layout. */
const CORES = ["ambar", "azul", "roxo", "verde", "turquesa"] as const;
const CORES_COOPERATIVA = ["verde", "ambar", "azul", "roxo", "turquesa"] as const;

interface RankingSetoresProps {
  readonly setores: readonly GeracaoPorSetor[];
}

export function RankingSetores({ setores }: RankingSetoresProps): ReactNode {
  const maior = Math.max(...setores.map((setor) => setor.kg), 1);

  return (
    <ol className="rel__ranking">
      {setores.map((setor, indice) => (
        <li key={setor.nome} className="rel__ranking-item">
          <span className="rel__posicao" data-cor={CORES[indice % CORES.length]}>
            {indice + 1}
          </span>
          <b className="rel__ranking-nome">{setor.nome}</b>
          <span className="rel__trilho" aria-hidden="true">
            <span style={{ width: `${(setor.kg / maior) * 100}%` }} />
          </span>
          <b className="rel__ranking-valor">{formatarKg(setor.kg)}</b>
        </li>
      ))}
    </ol>
  );
}

interface DestinacaoProps {
  readonly destinos: readonly DestinacaoCooperativa[];
}

export function DestinacaoCooperativas({ destinos }: DestinacaoProps): ReactNode {
  return (
    <ul className="rel__destinos">
      {destinos.map((destino, indice) => (
        <li key={destino.cooperativaId} className="rel__destino">
          <span
            className="rel__logo"
            data-cor={CORES_COOPERATIVA[indice % CORES_COOPERATIVA.length]}
            aria-hidden="true"
          >
            <span />
          </span>
          <b className="rel__destino-nome">{destino.nome}</b>
          <span className="rel__trilho rel__trilho--curto" aria-hidden="true">
            <span style={{ width: `${destino.percentual}%` }} />
          </span>
          <b className="rel__destino-valor">{destino.percentual}%</b>
        </li>
      ))}
    </ul>
  );
}
