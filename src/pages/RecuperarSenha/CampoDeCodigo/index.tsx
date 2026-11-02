import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

const TAMANHO_DO_CODIGO = 4;

interface CampoDeCodigoProps {
  readonly valor: string;
  readonly aoMudar: (valor: string) => void;
  /** Texto lido por quem usa leitor de tela: os quadrados são só o desenho. */
  readonly rotulo: string;
  readonly comErro?: boolean;
  /** Id da mensagem de erro, para o campo apontar para ela. */
  readonly idErro?: string;
  readonly desabilitado?: boolean;
}

/**
 * Código de 4 dígitos. Um único campo recebe a digitação, a colagem e o
 * preenchimento do celular (`one-time-code`); os quatro quadrados só mostram o
 * que foi digitado e qual é o próximo.
 */
export function CampoDeCodigo({
  valor,
  aoMudar,
  rotulo,
  comErro = false,
  idErro,
  desabilitado = false,
}: CampoDeCodigoProps): ReactNode {
  const entrada = useRef<HTMLInputElement | null>(null);
  const [focado, setFocado] = useState<boolean>(false);
  const proximo = Math.min(valor.length, TAMANHO_DO_CODIGO - 1);

  useEffect(() => {
    entrada.current?.focus();
  }, []);

  function levarCursorAoFim(): void {
    const campo = entrada.current;
    if (campo) campo.setSelectionRange(campo.value.length, campo.value.length);
  }

  return (
    <div
      className={`codigo${comErro ? " codigo--erro" : ""}${focado ? " codigo--foco" : ""}`}
    >
      {Array.from({ length: TAMANHO_DO_CODIGO }, (_, indice) => (
        <span
          key={indice}
          aria-hidden="true"
          className={`codigo__digito${
            valor[indice] ? " codigo__digito--cheio" : ""
          }${focado && indice === proximo ? " codigo__digito--proximo" : ""}`}
        >
          {valor[indice] ?? ""}
        </span>
      ))}
      <input
        ref={entrada}
        className="codigo__entrada"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={TAMANHO_DO_CODIGO}
        aria-label={rotulo}
        aria-invalid={comErro || undefined}
        aria-describedby={idErro}
        value={valor}
        disabled={desabilitado}
        onChange={(evento) =>
          aoMudar(evento.target.value.replace(/\D/g, "").slice(0, TAMANHO_DO_CODIGO))
        }
        onFocus={() => {
          setFocado(true);
          levarCursorAoFim();
        }}
        onBlur={() => setFocado(false)}
        onClick={levarCursorAoFim}
      />
    </div>
  );
}
