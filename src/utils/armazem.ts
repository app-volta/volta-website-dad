/**
 * Guarda um valor fora dos componentes e avisa quem assina quando ele muda.
 * Serve para o estado que precisa sobreviver à troca de página (cada rota
 * monta o próprio layout), lido com `useSyncExternalStore`.
 */
export interface Armazem<T> {
  readonly obter: () => T;
  readonly definir: (novo: T) => void;
  readonly assinar: (ouvinte: () => void) => () => void;
}

export function criarArmazem<T>(inicial: T): Armazem<T> {
  let valor = inicial;
  const ouvintes = new Set<() => void>();

  return {
    obter: () => valor,
    definir: (novo) => {
      valor = novo;
      ouvintes.forEach((ouvinte) => ouvinte());
    },
    assinar: (ouvinte) => {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
  };
}
