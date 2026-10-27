import type { ReactNode } from "react";

import type { Trecho } from "../../types/notificacao";

interface TextoComDestaqueProps {
  readonly trechos: readonly Trecho[];
}

/** Texto em trechos, com destaque em negrito. A chave de cada trecho é a posição dele no texto. */
export function TextoComDestaque({ trechos }: TextoComDestaqueProps): ReactNode {
  const comPosicao = trechos.reduce<
    readonly { readonly inicio: number; readonly trecho: Trecho }[]
  >((acumulado, trecho) => {
    const anterior = acumulado[acumulado.length - 1];
    const inicio = anterior ? anterior.inicio + anterior.trecho.texto.length : 0;
    return [...acumulado, { inicio, trecho }];
  }, []);

  return comPosicao.map(({ inicio, trecho }) =>
    trecho.destaque ? (
      <strong key={inicio}>{trecho.texto}</strong>
    ) : (
      <span key={inicio}>{trecho.texto}</span>
    ),
  );
}
