/**
 * Utilitário compartilhado da camada de services.
 *
 * Toda chamada a APIs externas passa pelas funções de src/services/. Componentes
 * e páginas nunca usam `fetch` diretamente — isso mantém o tratamento de erro,
 * o cancelamento, o tempo limite e o token em um único lugar.
 */

import type { ProblemaApi } from "../types/api";
import {
  MENSAGEM_SEM_CONEXAO,
  MENSAGEM_TEMPO_ESGOTADO,
  traduzirErro,
} from "./mensagensApi";

const BASE_URL: string = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""
).replace(/\/+$/, "");

/**
 * Base do chatbot. Também passa por proxy: o navegador chama /chat-api e o
 * proxy (Vite ou vercel.json) repassa ao serviço.
 */
export const BASE_CHATBOT: string = (
  (import.meta.env.VITE_CHAT_API_BASE_URL as string | undefined) ?? "/chat-api"
).replace(/\/+$/, "");

/**
 * Base da API de ranking (volta-api-redis): ranking de empresas, cooperativas
 * próximas e pontuação de cooperativas por ocorrência. Também por proxy.
 */
export const BASE_RANKING: string = (
  (import.meta.env.VITE_RANKING_API_BASE_URL as string | undefined) ??
  "/ranking-api"
).replace(/\/+$/, "");

/**
 * Os mocks locais ficam ligados por padrão: o app roda sem backend, no CI e no
 * Docker. A API real só entra com VITE_USAR_MOCKS=false.
 */
export const USAR_MOCKS: boolean =
  (import.meta.env.VITE_USAR_MOCKS as string | undefined) !== "false";

const TEMPO_LIMITE_MS = 20_000;

export class ErroHttp extends Error {
  readonly status: number;
  readonly campos: Readonly<Record<string, string>>;

  constructor(
    mensagem: string,
    status: number,
    campos: Readonly<Record<string, string>> = {},
  ) {
    super(mensagem);
    this.status = status;
    this.campos = campos;
    this.name = "ErroHttp";
  }
}

export interface UsuarioAtual {
  readonly id: string;
  readonly nome: string;
  readonly empresaId?: string;
  readonly perfil?: "ADMIN" | "MANAGER" | "EMPLOYEE" | "OPERATOR";
}

/** Ligação entre a camada HTTP e a sessão, sem os services conhecerem React. */
export interface GanchosSessao {
  readonly obterToken: () => string | null;
  readonly obterUsuario: () => UsuarioAtual | null;
  readonly aoNaoAutorizado: () => void;
}

let ganchos: GanchosSessao | null = null;
const aoEncerrar = new Set<() => void>();

export function configurarSessaoHttp(novos: GanchosSessao | null): void {
  ganchos = novos;
}

export function obterUsuarioAtual(): UsuarioAtual | null {
  return ganchos?.obterUsuario() ?? null;
}

/** Registra uma limpeza (cache, estado em memória) para quando a sessão mudar. */
export function aoEncerrarSessao(limpar: () => void): () => void {
  aoEncerrar.add(limpar);
  return () => {
    aoEncerrar.delete(limpar);
  };
}

/** Avisa os services que a sessão acabou ou trocou de pessoa. */
export function encerrarSessaoHttp(): void {
  for (const limpar of aoEncerrar) limpar();
}

export interface OpcoesRequisicao {
  readonly sinal?: AbortSignal;
  readonly corpo?: unknown;
  readonly metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** `null` envia sem token (login). Omitido, usa o token da sessão atual. */
  readonly token?: string | null;
  /** Base da chamada. Omitida, usa a da volta-api. */
  readonly base?: string;
  /** Tempo limite desta chamada. Omitido, 20 s. */
  readonly tempoLimiteMs?: number;
  /** Usa o `detail` que o servidor devolve (já em português) como mensagem de erro. */
  readonly detalheDoServidor?: boolean;
  /** Um 401 desta chamada não encerra a sessão do app (serviços que só validam o token). */
  readonly semLogoutEm401?: boolean;
}

async function erroDaResposta(
  resposta: Response,
  autenticada: boolean,
  opcoes: OpcoesRequisicao,
): Promise<ErroHttp> {
  let problema: ProblemaApi | null = null;
  try {
    problema = (await resposta.json()) as ProblemaApi;
  } catch {
    problema = null;
  }

  if (resposta.status === 401 && autenticada && !opcoes.semLogoutEm401) {
    ganchos?.aoNaoAutorizado();
  }

  const detalhe =
    opcoes.detalheDoServidor && resposta.status !== 401
      ? problema?.detail?.trim()
      : undefined;

  return new ErroHttp(
    typeof detalhe === "string" && detalhe !== ""
      ? detalhe
      : traduzirErro(resposta.status, problema, autenticada),
    resposta.status,
    problema?.errors ?? {},
  );
}

export async function requisitar<Resposta>(
  caminho: string,
  opcoes: OpcoesRequisicao = {},
): Promise<Resposta> {
  const cabecalhos: Record<string, string> = { Accept: "application/json" };
  // Em um upload (FormData) o navegador monta o Content-Type com o boundary.
  const ehFormulario = opcoes.corpo instanceof FormData;
  if (opcoes.corpo !== undefined && !ehFormulario) {
    cabecalhos["Content-Type"] = "application/json";
  }

  const token =
    opcoes.token !== undefined ? opcoes.token : (ganchos?.obterToken() ?? null);
  if (token) {
    cabecalhos.Authorization = `Bearer ${token}`;
  }

  const limite = AbortSignal.timeout(opcoes.tempoLimiteMs ?? TEMPO_LIMITE_MS);
  const sinal = opcoes.sinal ? AbortSignal.any([opcoes.sinal, limite]) : limite;

  let resposta: Response;
  try {
    resposta = await fetch(`${opcoes.base ?? BASE_URL}${caminho}`, {
      method: opcoes.metodo ?? "GET",
      headers: cabecalhos,
      body:
        opcoes.corpo === undefined
          ? null
          : opcoes.corpo instanceof FormData
            ? opcoes.corpo
            : JSON.stringify(opcoes.corpo),
      signal: sinal,
    });
  } catch (excecao) {
    // Cancelamento pedido por quem chamou: o hook já ignora esse caso.
    if (opcoes.sinal?.aborted) throw excecao;
    throw new ErroHttp(
      limite.aborted ? MENSAGEM_TEMPO_ESGOTADO : MENSAGEM_SEM_CONEXAO,
      0,
    );
  }

  if (!resposta.ok) {
    throw await erroDaResposta(resposta, token !== null, opcoes);
  }

  if (resposta.status === 204) {
    return undefined as Resposta;
  }

  const texto = await resposta.text();
  if (!texto) {
    return undefined as Resposta;
  }

  try {
    return JSON.parse(texto) as Resposta;
  } catch {
    throw new ErroHttp(
      "O servidor respondeu em um formato inesperado.",
      resposta.status,
    );
  }
}

/**
 * Espera uma promessa que outras telas também usam (como o catálogo de áreas e
 * tipos, buscado uma vez por sessão), mas solta quem esperava assim que o
 * `sinal` for cancelado. A busca em si segue, porque é compartilhada.
 */
export function esperarAte<Resposta>(
  promessa: Promise<Resposta>,
  sinal?: AbortSignal,
): Promise<Resposta> {
  if (!sinal) return promessa;
  return new Promise<Resposta>((resolver, rejeitar) => {
    const cancelar = (): void =>
      rejeitar(new DOMException("Requisição cancelada", "AbortError"));
    if (sinal.aborted) {
      cancelar();
      return;
    }
    sinal.addEventListener("abort", cancelar, { once: true });
    promessa
      .then(resolver, rejeitar)
      .finally(() => sinal.removeEventListener("abort", cancelar));
  });
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
