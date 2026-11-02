import { useEffect, useId, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Alerta } from "../../../components/Alerta";
import { Button } from "../../../components/Button";
import { Icone } from "../../../components/Icone";
import { CampoDeCodigo } from "../CampoDeCodigo";

/** Segundos até a pessoa poder pedir outro código. */
const INTERVALO_DE_REENVIO_S = 60;

interface EtapaCodigoProps {
  readonly email: string;
  /** Só na demonstração (sem API, sem e-mail): o código que ela aceita. */
  readonly dicaDaDemonstracao: string | null;
  /** Confere o código; rejeita com o motivo quando ele não vale. */
  readonly aoConfirmar: (codigo: string) => Promise<void>;
  readonly aoReenviar: () => Promise<void>;
}

function tempoRestante(segundos: number): string {
  return `0:${String(segundos).padStart(2, "0")}`;
}

/** 01c · Código de verificação: os 4 dígitos que chegaram por e-mail. */
export function EtapaCodigo({
  email,
  dicaDaDemonstracao,
  aoConfirmar,
  aoReenviar,
}: EtapaCodigoProps): ReactNode {
  const idErro = useId();
  const [codigo, setCodigo] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [conferindo, setConferindo] = useState<boolean>(false);
  const [reenviando, setReenviando] = useState<boolean>(false);
  const [restante, setRestante] = useState<number>(INTERVALO_DE_REENVIO_S);

  useEffect(() => {
    if (restante <= 0) return undefined;
    const id = window.setTimeout(() => setRestante((segundos) => segundos - 1), 1000);
    return () => window.clearTimeout(id);
  }, [restante]);

  async function confirmar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setAviso(null);
    if (codigo.length !== 4) {
      setErro("Digite os 4 dígitos do código.");
      return;
    }
    setErro(null);
    setConferindo(true);
    try {
      await aoConfirmar(codigo);
    } catch (excecao: unknown) {
      setErro(
        excecao instanceof Error
          ? excecao.message
          : "Não foi possível conferir o código. Tente de novo.",
      );
      setCodigo("");
      setConferindo(false);
    }
  }

  async function reenviar(): Promise<void> {
    setReenviando(true);
    setErro(null);
    try {
      await aoReenviar();
      setCodigo("");
      setRestante(INTERVALO_DE_REENVIO_S);
      setAviso("Enviamos um novo código para o seu e-mail.");
    } catch (excecao: unknown) {
      setErro(
        excecao instanceof Error
          ? excecao.message
          : "Não foi possível reenviar o código. Tente de novo.",
      );
    } finally {
      setReenviando(false);
    }
  }

  return (
    <>
      <span className="recuperar__chip" aria-hidden="true">
        <Icone nome="cadeado" tamanho={26} />
      </span>
      <h1 className="login-tela__titulo">Confirme o código</h1>
      <p className="login-tela__descricao recuperar__email">
        Enviamos um código de 4 dígitos para {email}
      </p>

      {dicaDaDemonstracao ? (
        <Alerta variante="info" titulo="Modo demonstração">
          Não há e-mail de verdade aqui. Use o código {dicaDaDemonstracao}.
        </Alerta>
      ) : null}
      {aviso ? <Alerta variante="sucesso">{aviso}</Alerta> : null}

      <form onSubmit={(evento) => void confirmar(evento)} noValidate>
        <CampoDeCodigo
          valor={codigo}
          aoMudar={(valor) => {
            setCodigo(valor);
            setErro(null);
          }}
          rotulo="Código de 4 dígitos"
          comErro={erro !== null}
          idErro={erro ? idErro : undefined}
          desabilitado={conferindo}
        />
        {erro ? (
          <p id={idErro} role="alert" className="campo__erro">
            {erro}
          </p>
        ) : null}
        <Button type="submit" larguraTotal carregando={conferindo}>
          Confirmar
        </Button>
      </form>

      {restante > 0 ? (
        <p className="recuperar__reenviar recuperar__reenviar--espera">
          Não recebeu? Reenviar em {tempoRestante(restante)}
        </p>
      ) : (
        <button
          type="button"
          className="recuperar__reenviar"
          onClick={() => void reenviar()}
          disabled={reenviando}
        >
          {reenviando ? "Reenviando…" : "Não recebeu? Reenviar código"}
        </button>
      )}
    </>
  );
}
