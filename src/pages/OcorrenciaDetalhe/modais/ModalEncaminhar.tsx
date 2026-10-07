import { useId, useState } from "react";
import type { ReactNode } from "react";

import { Alerta } from "../../../components/Alerta";
import { Icone } from "../../../components/Icone";
import { ModalAcao } from "../../../components/ModalAcao";
import { OpcaoRadio } from "./OpcaoRadio";

const SETORES: readonly {
  readonly setor: string;
  readonly responsavel: string;
  readonly iniciais: string;
}[] = [
  { setor: "Expedição", responsavel: "Carla Mendes", iniciais: "CM" },
  { setor: "Qualidade", responsavel: "Ana Souza", iniciais: "AS" },
  { setor: "Manutenção", responsavel: "João Pereira", iniciais: "JP" },
  { setor: "Refeitório", responsavel: "Rafael Lima", iniciais: "RL" },
];

interface ModalEncaminharProps {
  readonly salvando: boolean;
  readonly erro: string | null;
  readonly aoConfirmar: (setor: string, mensagem: string) => void;
  readonly aoFechar: () => void;
}

export function ModalEncaminhar({
  salvando,
  erro,
  aoConfirmar,
  aoFechar,
}: ModalEncaminharProps): ReactNode {
  const idMensagem = useId();
  const [setor, setSetor] = useState<string>(SETORES[0].setor);
  const [mensagem, setMensagem] = useState<string>("");

  return (
    <ModalAcao
      aberto
      bloqueado={salvando}
      icone="seta-direita"
      tom="azul"
      titulo="Encaminhar para outro setor"
      subtitulo="O responsável do setor recebe na hora."
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
            className="modal-acao__botao modal-acao__botao--primario"
            onClick={() => aoConfirmar(setor, mensagem)}
            disabled={salvando}
          >
            <Icone nome="seta-direita" tamanho={14} />
            {salvando ? "Encaminhando…" : "Encaminhar"}
          </button>
        </>
      }
    >
      <fieldset className="opcoes">
        <legend className="sr-only">Setor de destino</legend>
        {SETORES.map((opcao) => (
          <OpcaoRadio
            key={opcao.setor}
            nome="setor-destino"
            valor={opcao.setor}
            rotulo={opcao.setor}
            detalhe={`${opcao.responsavel} · responsável`}
            avatar={opcao.iniciais}
            selecionado={setor === opcao.setor}
            aoSelecionar={setSetor}
          />
        ))}
      </fieldset>

      <div className="campo-modal">
        <label htmlFor={idMensagem} className="campo-modal__rotulo">
          Mensagem pro setor{" "}
          <span className="campo-modal__opcional">· opcional</span>
        </label>
        <textarea
          id={idMensagem}
          className="campo-modal__texto"
          placeholder="Ex.: Sai no próximo envio. Consegue separar na doca 2?"
          maxLength={280}
          value={mensagem}
          onChange={(evento) => setMensagem(evento.target.value)}
        />
      </div>

      {erro ? (
        <Alerta variante="erro" titulo="Não foi possível encaminhar">
          {erro}
        </Alerta>
      ) : null}
    </ModalAcao>
  );
}
