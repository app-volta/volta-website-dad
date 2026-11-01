import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Alerta } from "../../../components/Alerta";
import { Icone } from "../../../components/Icone";
import { ModalAcao } from "../../../components/ModalAcao";
import { PAPEIS_EQUIPE } from "../../../types/equipe";
import type { NovoConvite, PapelEquipe } from "../../../types/equipe";
import {
  DESCRICOES_PAPEL,
  ROTULOS_PAPEL,
  validarEmailConvite,
} from "../../../utils/equipe";
import { OpcaoRadio } from "../../OcorrenciaDetalhe/modais/OpcaoRadio";
import ".././modal.css";

interface ModalConvidarProps {
  /** Na volta-api não há convite por e-mail: a conta é criada na hora, com nome e senha. */
  readonly criaAcesso?: boolean;
  readonly salvando: boolean;
  readonly erro: string | null;
  /** E-mail que a API recusou por já estar cadastrado: o campo avisa até a pessoa mudá-lo. */
  readonly emailRecusado?: string | null;
  readonly aoConfirmar: (convite: NovoConvite) => void;
  readonly aoFechar: () => void;
}

export function ModalConvidar({
  criaAcesso = false,
  salvando,
  erro,
  emailRecusado = null,
  aoConfirmar,
  aoFechar,
}: ModalConvidarProps): ReactNode {
  const idFormulario = useId();
  const idEmail = useId();
  const idNome = useId();
  const idSenha = useId();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState<string>("");
  const [nome, setNome] = useState<string>("");
  const [senha, setSenha] = useState<string>("");
  const [papel, setPapel] = useState<PapelEquipe>("colaborador");
  const [tentou, setTentou] = useState<boolean>(false);

  const emailJaCadastrado = emailRecusado !== null && email === emailRecusado;
  useEffect(() => {
    if (emailRecusado !== null) emailRef.current?.focus();
  }, [emailRecusado]);

  const erroEmail =
    validarEmailConvite(email) ??
    (emailJaCadastrado ? "Este e-mail já está cadastrado. Confira ou use outro." : null);
  const erroNome = criaAcesso && nome.trim().length < 3 ? "Informe o nome da pessoa." : null;
  const erroSenha =
    criaAcesso && (senha.length < 8 || senha.length > 72)
      ? "A senha precisa ter de 8 a 72 caracteres."
      : null;

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    if (salvando) return;
    setTentou(true);
    if (erroEmail) {
      emailRef.current?.focus();
      return;
    }
    if (erroNome || erroSenha) return;
    aoConfirmar(criaAcesso ? { email, papel, nome: nome.trim(), senha } : { email, papel });
  }

  return (
    <ModalAcao
      aberto
      bloqueado={salvando}
      icone="equipe"
      tom="verde"
      largura={520}
      titulo={criaAcesso ? "Cadastrar na equipe" : "Convidar pra equipe"}
      subtitulo={
        criaAcesso
          ? "A conta é criada na hora, com a senha que você definir."
          : "A pessoa recebe um e-mail pra criar a conta."
      }
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
            {salvando ? "Enviando…" : criaAcesso ? "Criar acesso" : "Enviar convite"}
          </button>
        </>
      }
    >
      <form id={idFormulario} className="eq-form" onSubmit={enviar} noValidate>
        {criaAcesso ? (
          <div className="eq-form__grupo">
            <label className="eq-form__rotulo" htmlFor={idNome}>
              Nome
            </label>
            <div className={`eq-form__campo${tentou && erroNome ? " eq-form__campo--erro" : ""}`}>
              <span className="eq-form__campo-icone" aria-hidden="true">
                <Icone nome="usuario" tamanho={16} />
              </span>
              <input
                id={idNome}
                type="text"
                value={nome}
                maxLength={150}
                autoComplete="off"
                aria-invalid={tentou && erroNome ? true : undefined}
                aria-describedby={tentou && erroNome ? `${idNome}-erro` : undefined}
                onChange={(evento) => setNome(evento.target.value)}
              />
            </div>
            {tentou && erroNome ? (
              <p className="eq-form__erro" id={`${idNome}-erro`}>
                {erroNome}
              </p>
            ) : null}
          </div>
        ) : null}

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

        {criaAcesso ? (
          <div className="eq-form__grupo">
            <label className="eq-form__rotulo" htmlFor={idSenha}>
              Senha de acesso
            </label>
            <div className={`eq-form__campo${tentou && erroSenha ? " eq-form__campo--erro" : ""}`}>
              <span className="eq-form__campo-icone" aria-hidden="true">
                <Icone nome="cadeado" tamanho={16} />
              </span>
              <input
                id={idSenha}
                type="password"
                value={senha}
                maxLength={72}
                autoComplete="new-password"
                aria-invalid={tentou && erroSenha ? true : undefined}
                aria-describedby={tentou && erroSenha ? `${idSenha}-erro` : undefined}
                onChange={(evento) => setSenha(evento.target.value)}
              />
            </div>
            {tentou && erroSenha ? (
              <p className="eq-form__erro" id={`${idSenha}-erro`}>
                {erroSenha}
              </p>
            ) : null}
          </div>
        ) : null}

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
