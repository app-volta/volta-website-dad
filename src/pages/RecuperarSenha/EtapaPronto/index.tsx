import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { Button } from "../../../components/Button";
import { Icone } from "../../../components/Icone";

interface EtapaProntoProps {
  readonly aoIrParaOLogin: () => void;
}

/** 01e · Senha redefinida. */
export function EtapaPronto({ aoIrParaOLogin }: EtapaProntoProps): ReactNode {
  const titulo = useRef<HTMLHeadingElement | null>(null);

  // O formulário que tinha o foco saiu da tela: o título anuncia o resultado.
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  return (
    <>
      <span className="recuperar__chip recuperar__chip--grande" aria-hidden="true">
        <Icone nome="check" tamanho={36} />
      </span>
      <h1 ref={titulo} tabIndex={-1} className="login-tela__titulo">
        Tudo certo!
      </h1>
      <p className="login-tela__descricao">
        Sua senha foi atualizada. Já pode entrar no painel com a senha nova.
      </p>
      <Button larguraTotal onClick={aoIrParaOLogin}>
        Ir para o login
      </Button>
    </>
  );
}
