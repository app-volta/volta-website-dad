import { useEffect, useState } from "react";

/**
 * Devolve `valor` só depois de `atrasoMs` sem mudar. Serve para o campo de
 * busca: a pessoa digita à vontade e a lista filtra quando ela faz uma pausa.
 */
export function useDebounce<T>(valor: T, atrasoMs = 300): T {
  const [atrasado, setAtrasado] = useState<T>(valor);

  useEffect(() => {
    const temporizador = window.setTimeout(() => setAtrasado(valor), atrasoMs);
    return () => window.clearTimeout(temporizador);
  }, [valor, atrasoMs]);

  return atrasado;
}
