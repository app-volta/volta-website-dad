import type { ReactNode } from "react";

import { ModalAcao } from "../../../components/ModalAcao";

interface ModalEnvioIncertoProps {
  readonly aberto: boolean;
  /** Leva à lista, para a pessoa ver se a ocorrência chegou antes de repetir. */
  readonly aoConferir: () => void;
  readonly aoEnviarDeNovo: () => void;
  readonly aoFechar: () => void;
}

/**
 * A conexão caiu bem na hora do envio e não dá para saber se a ocorrência foi
 * registrada. Pede para conferir a lista antes de enviar de novo, para não duplicar.
 */
export function ModalEnvioIncerto({
  aberto,
  aoConferir,
  aoEnviarDeNovo,
  aoFechar,
}: ModalEnvioIncertoProps): ReactNode {
  return (
    <ModalAcao
      aberto={aberto}
      centralizado
      icone="alerta"
      tom="ambar"
      largura={520}
      titulo="Não sabemos se o envio chegou"
      subtitulo="A conexão caiu bem na hora do envio. Confira a lista antes de mandar de novo, pra não registrar em dobro."
      aoFechar={aoFechar}
      rodape={
        <>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--primario"
            onClick={aoConferir}
          >
            Conferir ocorrências
          </button>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--contorno"
            onClick={aoEnviarDeNovo}
          >
            Enviar de novo
          </button>
        </>
      }
    />
  );
}
