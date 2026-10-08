import { useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { ModalAcao } from "../../components/ModalAcao";
import { validarObrigatorio } from "../../utils/validadores";
import "./modal.css";

const NOME_MINIMO = 3;

interface ModalPerfilProps {
  readonly nomeAtual: string;
  readonly email: string;
  readonly aoSalvar: (nome: string) => void;
  readonly aoFechar: () => void;
}

function validarNome(valor: string): string | null {
  const obrigatorio = validarObrigatorio(valor, "o nome", 80);
  if (obrigatorio) return obrigatorio;
  if (valor.trim().length < NOME_MINIMO) {
    return `O nome precisa de pelo menos ${NOME_MINIMO} letras.`;
  }
  return null;
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

  const erro = validarNome(nome);

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    setTentou(true);
    if (erro) {
      nomeRef.current?.focus();
      return;
    }
    aoSalvar(nome.trim());
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
          >
            Salvar
          </button>
        </>
      }
    >
      <form id={idFormulario} className="cfg-form" onSubmit={enviar} noValidate>
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
      </form>
    </ModalAcao>
  );
}
