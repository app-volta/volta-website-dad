import type { SessaoAutenticada } from "../types/usuario";
import { carregar, remover, salvar } from "./armazenamento";
import type { Armazenamento } from "./armazenamento";

/**
 * Onde a sessão do login fica guardada. Com "Manter conectado" ela vai para o
 * `localStorage` e sobrevive ao fechamento do navegador; sem ele, vai para o
 * `sessionStorage`, que o navegador apaga quando a aba fecha.
 */
export const CHAVE_DA_SESSAO = "volta:sessao";
const VERSAO_DA_SESSAO = 1;

/** Primeiro onde sobrevive ao navegador, depois o da aba. */
const ONDE_PROCURAR: readonly Armazenamento[] = ["local", "sessao"];

export interface SessaoGuardada {
  readonly sessao: SessaoAutenticada;
  readonly onde: Armazenamento;
}

/** A sessão guardada que ainda não venceu, e em qual dos dois lugares ela estava. */
export function lerSessaoGuardada(agora: number = Date.now()): SessaoGuardada | null {
  for (const onde of ONDE_PROCURAR) {
    const sessao = carregar<SessaoAutenticada>(CHAVE_DA_SESSAO, VERSAO_DA_SESSAO, onde);
    if (sessao && new Date(sessao.expiraEm).getTime() > agora) return { sessao, onde };
  }
  return null;
}

/** Guarda a sessão num lugar só: a cópia do outro é apagada, para não sobrar uma sessão esquecida. */
export function guardarSessao(sessao: SessaoAutenticada, onde: Armazenamento): void {
  salvar(CHAVE_DA_SESSAO, VERSAO_DA_SESSAO, sessao, onde);
  remover(CHAVE_DA_SESSAO, onde === "local" ? "sessao" : "local");
}

export function esquecerSessao(): void {
  for (const onde of ONDE_PROCURAR) remover(CHAVE_DA_SESSAO, onde);
}
