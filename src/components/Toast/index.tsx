import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { Icone } from "../Icone";
import "./styles.css";

interface ToastProps {
  readonly aberto: boolean;
  readonly titulo: string;
  readonly descricao?: string;
  /** `erro` é a variante escura com o ícone vermelho e anuncia na hora (`role=alert`). */
  readonly variante?: "sucesso" | "erro";
  readonly duracaoMs?: number;
  readonly aoFechar: () => void;
}

/** Aviso rápido (`role=status`, `aria-live=polite`) que chama `aoFechar` sozinho depois de `duracaoMs` (padrão: 4,5 s). */
export function Toast({
  aberto,
  titulo,
  descricao,
  variante = "sucesso",
  duracaoMs = 4500,
  aoFechar,
}: ToastProps): ReactNode {
  const fechar = useRef(aoFechar);

  // A ref guarda a versão mais recente de `aoFechar`: o temporizador de baixo
  // chama sempre ela, sem reiniciar a contagem quando a função muda.
  useEffect(() => {
    fechar.current = aoFechar;
  }, [aoFechar]);

  useEffect(() => {
    if (!aberto) return;
    const temporizador = window.setTimeout(() => fechar.current(), duracaoMs);
    return () => window.clearTimeout(temporizador);
  }, [aberto, duracaoMs]);

  if (!aberto) return null;

  const erro = variante === "erro";

  return (
    <div
      className={erro ? "toast toast--erro" : "toast"}
      role={erro ? "alert" : "status"}
      aria-live={erro ? "assertive" : "polite"}
    >
      <span className="toast__icone" aria-hidden="true">
        <Icone nome={erro ? "fechar" : "check"} tamanho={18} />
      </span>
      <div>
        <p className="toast__titulo">{titulo}</p>
        {descricao ? <p className="toast__descricao">{descricao}</p> : null}
      </div>
    </div>
  );
}
