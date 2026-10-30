import { useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { ModalAcao } from "../../../components/ModalAcao";
import { validarNome } from "../../../utils/validadores";
import ".././modal.css";

interface ModalPerfilProps {
  readonly nomeAtual: string;
  readonly email: string;
  /** Grava o perfil; rejeita com o motivo quando o servidor recusa. */
  readonly aoSalvar: (nome: string) => Promise<void>;
  readonly aoFechar: () => void;
}

export function ModalPerfil({
  nomeAtual,
  email,
  aoSalvar,
  aoFechar,
}: ModalPerfilProps): ReactNode {
  const idFormulario = useId();
  const idNome = useId();
  const nomeRef = useRef<HTMLInputElement | null>(null);
  const [nome, setNome] = useState<string>(nomeAtual);
  const [tentou, setTentou] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const erro = validarNome(nome);

  async function enviar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setTentou(true);
    if (erro) {
      nomeRef.current?.focus();
      return;
    }
    setSalvando(true);
    setErroServidor(null);
    try {
      await aoSalvar(nome.trim());
    } catch (excecao: unknown) {
      setErroServidor(
        excecao instanceof Error
          ? excecao.message
          : "Não foi possível salvar o perfil.",
      );
      setSalvando(false);
    }
  }

  return (
    <ModalAcao
      aberto
      icone="usuario"
      tom="verde"
      largura={480}
      titulo="Editar perfil"
      subtitulo="O nome aparece para a equipe e nos relatórios."
      aoFechar={aoFechar}
      rodape={
        <>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--contorno"
            onClick={aoFechar}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form={idFormulario}
            className="modal-acao__botao modal-acao__botao--primario"
            disabled={salvando}
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </>
      }
    >
      <form
        id={idFormulario}
        className="cfg-form"
        onSubmit={(evento) => void enviar(evento)}
        noValidate
      >
        <div className="cfg-form__grupo">
          <label className="cfg-form__rotulo" htmlFor={idNome}>
            Nome
          </label>
          <input
            ref={nomeRef}
            id={idNome}
            type="text"
            className={`cfg-form__campo${tentou && erro ? " cfg-form__campo--erro" : ""}`}
            value={nome}
            maxLength={80}
            autoComplete="name"
            aria-invalid={tentou && erro ? true : undefined}
            aria-describedby={tentou && erro ? `${idNome}-erro` : undefined}
            onChange={(evento) => setNome(evento.target.value)}
          />
          {tentou && erro ? (
            <p className="cfg-form__erro" id={`${idNome}-erro`}>
              {erro}
            </p>
          ) : null}
        </div>
        <div className="cfg-form__grupo">
          <span className="cfg-form__rotulo">E-mail</span>
          <p className="cfg-form__somente-leitura">{email}</p>
        </div>
        {erroServidor ? (
          <p className="cfg-form__erro" role="alert">
            {erroServidor}
          </p>
        ) : null}
      </form>
    </ModalAcao>
  );
}
