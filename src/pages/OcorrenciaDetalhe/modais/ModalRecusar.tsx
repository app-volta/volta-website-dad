import { useState } from "react";
import type { ReactNode } from "react";

import { Alerta } from "../../../components/Alerta";
import { Icone } from "../../../components/Icone";
import { ModalAcao } from "../../../components/ModalAcao";
import { OpcaoRadio } from "./OpcaoRadio";

const MOTIVOS_RECUSA: readonly string[] = [
  "Foto não mostra o resíduo",
  "Não é resíduo (item em uso)",
  "Ocorrência duplicada",
  "Outro motivo",
];

interface ModalRecusarProps {
  readonly salvando: boolean;
  readonly erro: string | null;
  readonly aoConfirmar: (motivo: string) => void;
  readonly aoFechar: () => void;
}

export function ModalRecusar({
  salvando,
  erro,
  aoConfirmar,
  aoFechar,
}: ModalRecusarProps): ReactNode {
  const [motivo, setMotivo] = useState<string>(MOTIVOS_RECUSA[0]);

  return (
    <ModalAcao
      aberto
      bloqueado={salvando}
      icone="fechar"
      tom="rosa"
      titulo="Recusar ocorrência"
      subtitulo="Quem registrou recebe o motivo e pode registrar de novo."
      aoFechar={aoFechar}
      rodape={
        <>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--contorno"
            onClick={aoFechar}
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--perigo"
            onClick={() => aoConfirmar(motivo)}
            disabled={salvando}
          >
            <Icone nome="fechar" tamanho={14} />
            {salvando ? "Recusando…" : "Recusar ocorrência"}
          </button>
        </>
      }
    >
      <fieldset className="opcoes">
        <legend className="sr-only">Motivo da recusa</legend>
        {MOTIVOS_RECUSA.map((opcao) => (
          <OpcaoRadio
            key={opcao}
            nome="motivo-recusa"
            valor={opcao}
            rotulo={opcao}
            selecionado={motivo === opcao}
            aoSelecionar={setMotivo}
          />
        ))}
      </fieldset>
      {erro ? (
        <Alerta variante="erro" titulo="Não foi possível recusar">
          {erro}
        </Alerta>
      ) : null}
    </ModalAcao>
  );
}
