import type { ReactNode } from "react";

import { ModalAcao } from "../../../components/ModalAcao";

export interface FalhaMostrada {
  readonly id: string;
  /** "#0478 · Plástico filme", como a ocorrência aparece na lista. */
  readonly rotulo: string;
  readonly motivo: string;
}

interface ModalAprovacaoParcialProps {
  readonly aberto: boolean;
  readonly aprovadas: number;
  readonly total: number;
  readonly falhas: readonly FalhaMostrada[];
  /** Tenta de novo só as que ficaram de fora. */
  readonly aoTentarDeNovo: () => void;
  readonly aoFechar: () => void;
}

/**
 * Resultado da aprovação em massa quando só parte passou: diz quantas foram
 * aprovadas e por que as outras ficaram de fora, sem esconder a falha.
 */
export function ModalAprovacaoParcial({
  aberto,
  aprovadas,
  total,
  falhas,
  aoTentarDeNovo,
  aoFechar,
}: ModalAprovacaoParcialProps): ReactNode {
  const restantes = total - aprovadas;
  return (
    <ModalAcao
      aberto={aberto}
      centralizado
      icone="alerta"
      tom="ambar"
      largura={520}
      titulo={`${aprovadas} de ${total} ocorrências aprovadas`}
      subtitulo={
        (restantes === 1
          ? "A outra continua aguardando aprovação."
          : "As outras continuam aguardando aprovação.") +
        " Confira o motivo e tente de novo."
      }
      aoFechar={aoFechar}
      rodape={
        <>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--primario"
            onClick={aoTentarDeNovo}
          >
            Tentar de novo
          </button>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--contorno"
            onClick={aoFechar}
          >
            Ver ocorrências
          </button>
        </>
      }
    >
      <ul className="aprovacao-parcial__lista">
        {falhas.map((falha) => (
          <li key={falha.id}>
            {falha.rotulo}: {falha.motivo}
          </li>
        ))}
      </ul>
    </ModalAcao>
  );
}
