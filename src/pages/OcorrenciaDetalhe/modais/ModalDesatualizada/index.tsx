import type { ReactNode } from "react";

import { ModalAcao } from "../../../../components/ModalAcao";

interface ModalDesatualizadaProps {
  readonly aberto: boolean;
  /** Recarrega a ocorrência para a pessoa ver como ela está agora. */
  readonly aoVerAgora: () => void;
  readonly aoVoltarParaLista: () => void;
}

/**
 * Outra pessoa já decidiu a ocorrência enquanto esta estava aberta, e a ação não foi
 * aplicada. Esc e clique fora fazem o mesmo que "Ver como ela está agora".
 */
export function ModalDesatualizada({
  aberto,
  aoVerAgora,
  aoVoltarParaLista,
}: ModalDesatualizadaProps): ReactNode {
  return (
    <ModalAcao
      aberto={aberto}
      centralizado
      icone="ciclo"
      tom="ambar"
      largura={520}
      titulo="Essa ocorrência mudou"
      subtitulo="Outra pessoa já aprovou ou encerrou esta ocorrência enquanto você olhava. Sua ação não foi aplicada."
      aoFechar={aoVerAgora}
      rodape={
        <>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--primario"
            onClick={aoVerAgora}
          >
            Ver como ela está agora
          </button>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--contorno"
            onClick={aoVoltarParaLista}
          >
            Voltar pra lista
          </button>
        </>
      }
    />
  );
}
