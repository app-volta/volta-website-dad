/**
 * Utilitário compartilhado da camada de services.
 *
 * Toda chamada a APIs externas passa pelas funções de src/services/. Componentes
 * e páginas nunca usam `fetch` diretamente — isso mantém o tratamento de erro,
 * o cancelamento e o timeout em um único lugar.
 */

const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export class ErroHttp extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
    this.name = "ErroHttp";
  }
}

export interface OpcoesRequisicao {
  readonly sinal?: AbortSignal;
  readonly corpo?: unknown;
  readonly metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly token?: string | null;
}

export async function requisitar<Resposta>(
  caminho: string,
  opcoes: OpcoesRequisicao = {},
): Promise<Resposta> {
  const url = `${BASE_URL}${caminho}`;
  const cabecalhos: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (opcoes.token) {
    cabecalhos.Authorization = `Bearer ${opcoes.token}`;
  }

  const resposta = await fetch(url, {
    method: opcoes.metodo ?? "GET",
    headers: cabecalhos,
    body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : null,
    signal: opcoes.sinal,
  });

  if (!resposta.ok) {
    throw new ErroHttp(
      `Falha na requisição a ${caminho}`,
      resposta.status,
    );
  }

  return resposta.json() as Promise<Resposta>;
}

/**
 * Espera um tempo controlado. Usado nos mocks para simular latência de rede
 * de forma cancelável.
 */
export function aguardar(ms: number, sinal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolver, rejeitar) => {
    if (sinal?.aborted) {
      rejeitar(new DOMException("Requisição cancelada", "AbortError"));
      return;
    }
    const id = setTimeout(resolver, ms);
    sinal?.addEventListener("abort", () => {
      clearTimeout(id);
      rejeitar(new DOMException("Requisição cancelada", "AbortError"));
    });
  });
}
