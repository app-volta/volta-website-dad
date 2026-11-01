import { useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { mensagemDoCampo } from "../../utils/erros";
import {
  DICA_DE_SENHA,
  validarConfirmacao,
  validarNovaSenha,
} from "../../utils/senha";
import { Alerta } from "../Alerta";
import { ForcaDaSenha } from "../ForcaDaSenha";
import { Input } from "../Input";
import { ModalAcao } from "../ModalAcao";
import "./styles.css";

interface ModalSenhaProps {
  /** Primeiro acesso: troca a senha provisória e só dá para sair do painel, não para fechar. */
  readonly obrigatorio?: boolean;
  /** Grava a senha nova; rejeita com o motivo quando o servidor recusa. */
  readonly aoSalvar: (senhaAtual: string, novaSenha: string) => Promise<void>;
  /** "Cancelar" ou, no primeiro acesso, "Sair do painel". */
  readonly aoFechar: () => void;
}

const MENSAGEM_IGUAL = "A nova senha precisa ser diferente da atual.";

export function ModalSenha({
  obrigatorio = false,
  aoSalvar,
  aoFechar,
}: ModalSenhaProps): ReactNode {
  const idFormulario = useId();
  const formulario = useRef<HTMLFormElement | null>(null);
  const [atual, setAtual] = useState<string>("");
  const [nova, setNova] = useState<string>("");
  const [confirmacao, setConfirmacao] = useState<string>("");
  const [mostrar, setMostrar] = useState<boolean>(false);
  const [tentou, setTentou] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [erroDaSenhaAtual, setErroDaSenhaAtual] = useState<string | null>(null);
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const erroAtual =
    erroDaSenhaAtual ?? (tentou && atual === "" ? "Informe a senha atual." : null);
  const problemaDaNova =
    validarNovaSenha(nova) ?? (nova === atual ? MENSAGEM_IGUAL : null);
  const problemaDaConfirmacao = validarConfirmacao(nova, confirmacao);
  const erroNova = tentou ? problemaDaNova : null;
  const erroConfirmacao = tentou ? problemaDaConfirmacao : null;

  function focarPrimeiroInvalido(): void {
    requestAnimationFrame(() =>
      formulario.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus(),
    );
  }

  async function enviar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setTentou(true);
    if (atual === "" || problemaDaNova !== null || problemaDaConfirmacao !== null) {
      focarPrimeiroInvalido();
      return;
    }
    setSalvando(true);
    setErroServidor(null);
    setErroDaSenhaAtual(null);
    try {
      await aoSalvar(atual, nova);
    } catch (excecao: unknown) {
      const daSenhaAtual = mensagemDoCampo(excecao, "senhaAtual");
      if (daSenhaAtual) {
        setErroDaSenhaAtual(daSenhaAtual);
        focarPrimeiroInvalido();
      } else {
        setErroServidor(
          excecao instanceof Error
            ? excecao.message
            : "Não foi possível alterar a senha.",
        );
      }
      setSalvando(false);
    }
  }

  const alternarVisibilidade = {
    icone: mostrar ? ("olho" as const) : ("olho-riscado" as const),
    rotulo: mostrar ? "Ocultar senhas" : "Mostrar senhas",
    aoClicar: () => setMostrar((valor) => !valor),
  };
  const tipo = mostrar ? "text" : "password";

  return (
    <ModalAcao
      aberto
      icone="cadeado"
      tom="verde"
      largura={520}
      bloqueado={salvando || obrigatorio}
      titulo={obrigatorio ? "Defina sua nova senha" : "Alterar senha"}
      subtitulo={
        obrigatorio
          ? `Troque a senha provisória por uma só sua. ${DICA_DE_SENHA}`
          : DICA_DE_SENHA
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
            {obrigatorio ? "Sair do painel" : "Cancelar"}
          </button>
          <button
            type="submit"
            form={idFormulario}
            className="modal-acao__botao modal-acao__botao--primario"
            disabled={salvando}
          >
            {salvando ? "Salvando…" : "Salvar nova senha"}
          </button>
        </>
      }
    >
      <form
        id={idFormulario}
        ref={formulario}
        className="modal-senha"
        onSubmit={(evento) => void enviar(evento)}
        noValidate
      >
        <Input
          rotulo={obrigatorio ? "Senha provisória" : "Senha atual"}
          type={tipo}
          autoComplete="current-password"
          iconeEsquerdo="cadeado"
          value={atual}
          onChange={(valor) => {
            setAtual(valor);
            setErroDaSenhaAtual(null);
          }}
          erro={erroAtual}
          acaoDireita={alternarVisibilidade}
        />
        <div className="modal-senha__nova">
          <Input
            rotulo="Nova senha"
            type={tipo}
            autoComplete="new-password"
            iconeEsquerdo="cadeado"
            value={nova}
            onChange={setNova}
            erro={erroNova}
            acaoDireita={alternarVisibilidade}
          />
          <ForcaDaSenha senha={nova} />
        </div>
        <Input
          rotulo="Confirmar nova senha"
          type={tipo}
          autoComplete="new-password"
          iconeEsquerdo="cadeado"
          value={confirmacao}
          onChange={setConfirmacao}
          erro={erroConfirmacao}
          acaoDireita={alternarVisibilidade}
        />
        {erroServidor ? (
          <Alerta variante="erro" titulo="Não foi possível alterar a senha">
            {erroServidor}
          </Alerta>
        ) : null}
      </form>
    </ModalAcao>
  );
}
