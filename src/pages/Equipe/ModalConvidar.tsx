import { useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Alerta } from "../../components/Alerta";
import { Icone } from "../../components/Icone";
import { ModalAcao } from "../../components/ModalAcao";
import { PAPEIS_EQUIPE } from "../../types/equipe";
import type { NovoConvite, PapelEquipe } from "../../types/equipe";
import {
  DESCRICOES_PAPEL,
  ROTULOS_PAPEL,
  validarEmailConvite,
} from "../../utils/equipe";
import { OpcaoRadio } from "../OcorrenciaDetalhe/modais/OpcaoRadio";
import "./modal.css";

interface ModalConvidarProps {
  readonly salvando: boolean;
  readonly erro: string | null;
  readonly aoConfirmar: (convite: NovoConvite) => void;
  readonly aoFechar: () => void;
}

export function ModalConvidar({
  salvando,
  erro,
  aoConfirmar,
  aoFechar,
}: ModalConvidarProps): ReactNode {
  const idFormulario = useId();
  const idEmail = useId();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState<string>("");
  const [papel, setPapel] = useState<PapelEquipe>("colaborador");
  const [tentou, setTentou] = useState<boolean>(false);

  const erroEmail = validarEmailConvite(email);

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    if (salvando) return;
    setTentou(true);
    if (erroEmail) {
      emailRef.current?.focus();
      return;
    }
    aoConfirmar({ email, papel });
  }

  return (
    <ModalAcao
      aberto
      bloqueado={salvando}
      icone="equipe"
      tom="verde"
      largura={520}
      titulo="Convidar pra equipe"
      subtitulo="A pessoa recebe um e-mail pra criar a conta."
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
            type="submit"
            form={idFormulario}
            className="modal-acao__botao modal-acao__botao--primario"
            disabled={salvando}
          >
            <Icone nome="enviar" tamanho={16} />
            {salvando ? "Enviando…" : "Enviar convite"}
          </button>
        </>
      }
    >
      <form id={idFormulario} className="eq-form" onSubmit={enviar} noValidate>
        <div className="eq-form__grupo">
          <label className="eq-form__rotulo" htmlFor={idEmail}>
            E-mail
          </label>
          <div
            className={`eq-form__campo${tentou && erroEmail ? " eq-form__campo--erro" : ""}`}
          >
            <span className="eq-form__campo-icone" aria-hidden="true">
              <Icone nome="email" tamanho={16} />
            </span>
            <input
              ref={emailRef}
              id={idEmail}
              type="email"
              value={email}
              placeholder="nome@empresa.com.br"
              autoComplete="off"
              aria-invalid={tentou && erroEmail ? true : undefined}
              aria-describedby={tentou && erroEmail ? `${idEmail}-erro` : undefined}
              onChange={(evento) => setEmail(evento.target.value)}
            />
          </div>
          {tentou && erroEmail ? (
            <p className="eq-form__erro" id={`${idEmail}-erro`}>
              {erroEmail}
            </p>
          ) : null}
        </div>

        <fieldset className="eq-form__grupo">
          <legend className="eq-form__rotulo">Papel</legend>
          <div className="eq-form__papeis">
            {PAPEIS_EQUIPE.map((item) => (
              <OpcaoRadio
                key={item}
                nome="papel-convite"
                valor={item}
                rotulo={ROTULOS_PAPEL[item]}
                detalhe={DESCRICOES_PAPEL[item]}
                selecionado={papel === item}
                aoSelecionar={() => setPapel(item)}
              />
            ))}
          </div>
        </fieldset>

        {erro ? (
          <Alerta variante="erro" titulo="Não foi possível convidar">
            {erro}
          </Alerta>
        ) : null}
      </form>
    </ModalAcao>
  );
}
