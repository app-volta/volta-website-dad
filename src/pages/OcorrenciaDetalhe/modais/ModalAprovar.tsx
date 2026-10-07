import type { ReactNode } from "react";

import { Alerta } from "../../../components/Alerta";
import { Icone } from "../../../components/Icone";
import { ModalAcao } from "../../../components/ModalAcao";

interface ModalAprovarProps {
  readonly aberto: boolean;
  readonly numero: string;
  readonly salvando: boolean;
  readonly erro: string | null;
  readonly aoConfirmar: () => void;
  readonly aoFechar: () => void;
}

export function ModalAprovar({
  aberto,
  numero,
  salvando,
  erro,
  aoConfirmar,
  aoFechar,
}: ModalAprovarProps): ReactNode {
  return (
    <ModalAcao
      aberto={aberto}
      centralizado
      bloqueado={salvando}
      icone="check"
      tom="verde"
      titulo={`Aprovar ocorrência #${numero}?`}
      subtitulo="Ela fica registrada como concluída e entra automaticamente no relatório PGRS do mês."
      aoFechar={aoFechar}
      rodape={
        <>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--contorno"
            onClick={aoFechar}
            disabled={salvando}
          >
            Voltar
          </button>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--primario"
            onClick={aoConfirmar}
            disabled={salvando}
          >
            <Icone nome="check" tamanho={15} />
            {salvando ? "Aprovando…" : "Sim, aprovar"}
          </button>
        </>
      }
    >
      {erro ? (
        <Alerta variante="erro" titulo="Não foi possível aprovar">
          {erro}
        </Alerta>
      ) : null}
    </ModalAcao>
  );
}
