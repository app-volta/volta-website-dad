import { aoEncerrarSessao, ErroHttp } from "./http";

/**
 * Guarda por um tempo o resultado de uma consulta que várias telas repetem
 * (coletas, cooperativas, métricas ESG). Falhas não ficam guardadas, exceto a
 * falta de permissão (403), que não muda durante a sessão e não precisa ser
 * perguntada de novo a cada tela. O que foi guardado some quando a sessão acaba.
 */
export interface CacheDeConsulta<T> {
  readonly obter: () => Promise<T>;
  readonly invalidar: () => void;
}

const VALIDADE_PADRAO_MS = 60_000;

export function criarCache<T>(
  buscar: () => Promise<T>,
  validadeMs: number = VALIDADE_PADRAO_MS,
): CacheDeConsulta<T> {
  let guardado: { readonly em: number; readonly promessa: Promise<T> } | null = null;

  const invalidar = (): void => {
    guardado = null;
  };
  aoEncerrarSessao(invalidar);

  return {
    invalidar,
    obter: () => {
      if (guardado && Date.now() - guardado.em < validadeMs) {
        return guardado.promessa;
      }
      const promessa = buscar().catch((excecao: unknown) => {
        const semPermissao = excecao instanceof ErroHttp && excecao.status === 403;
        if (!semPermissao && guardado?.promessa === promessa) guardado = null;
        throw excecao;
      });
      guardado = { em: Date.now(), promessa };
      return promessa;
    },
  };
}
