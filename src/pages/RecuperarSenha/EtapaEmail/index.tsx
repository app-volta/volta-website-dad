import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Alerta } from "../../../components/Alerta";
import { Button } from "../../../components/Button";
import { Icone } from "../../../components/Icone";
import { Input } from "../../../components/Input";
import { validarEmail } from "../../../utils/validadores";

interface EtapaEmailProps {
  readonly emailInicial: string;
  /** Pede o código por e-mail; rejeita com o motivo quando o envio falha. */
  readonly aoEnviarCodigo: (email: string) => Promise<void>;
}

/** 01b · Esqueci a senha: a pessoa informa o e-mail e a VOLTA manda o código. */
export function EtapaEmail({
  emailInicial,
  aoEnviarCodigo,
}: EtapaEmailProps): ReactNode {
  const [email, setEmail] = useState<string>(emailInicial);
  const [erroDoCampo, setErroDoCampo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);

  async function enviar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    const invalido = validarEmail(email);
    setErroDoCampo(invalido);
    setErro(null);
    if (invalido) return;
    setEnviando(true);
    try {
      await aoEnviarCodigo(email.trim());
    } catch (excecao: unknown) {
      setErro(
        excecao instanceof Error
          ? excecao.message
          : "Não foi possível enviar o código. Tente de novo em instantes.",
      );
      setEnviando(false);
    }
  }

  return (
    <>
      <span className="recuperar__chip" aria-hidden="true">
        <Icone nome="mensagem" tamanho={26} />
      </span>
      <h1 className="login-tela__titulo">Esqueceu a senha?</h1>
      <p className="login-tela__descricao">
        Sem problema. Digite o e-mail da sua unidade e enviamos um código para
        você criar uma nova senha.
      </p>

      {erro ? (
        <Alerta variante="erro" titulo="Não foi possível enviar o código">
          {erro}
        </Alerta>
      ) : null}

      <form onSubmit={(evento) => void enviar(evento)} noValidate>
        <Input
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          autoFocus
          required
          placeholder="nome@empresa.com.br"
          value={email}
          onChange={setEmail}
          erro={erroDoCampo}
          iconeEsquerdo="mensagem"
        />
        <Button type="submit" larguraTotal carregando={enviando}>
          Enviar código
        </Button>
      </form>
    </>
  );
}
