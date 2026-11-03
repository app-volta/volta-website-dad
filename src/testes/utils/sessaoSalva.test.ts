import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SessaoAutenticada } from "../../types/usuario";
import { carregar } from "../../utils/armazenamento";
import {
  CHAVE_DA_SESSAO,
  esquecerSessao,
  guardarSessao,
  lerSessaoGuardada,
} from "../../utils/sessaoSalva";

function armazemFalso(): Storage {
  const itens = new Map<string, string>();
  return {
    get length() {
      return itens.size;
    },
    clear: () => itens.clear(),
    getItem: (chave) => itens.get(chave) ?? null,
    key: (indice) => [...itens.keys()][indice] ?? null,
    removeItem: (chave) => void itens.delete(chave),
    setItem: (chave, valor) => void itens.set(chave, valor),
  };
}

const AGORA = new Date("2026-11-03T12:00:00Z").getTime();
const horasDepois = (horas: number): string => new Date(AGORA + horas * 3_600_000).toISOString();

function sessaoDe(token: string, expiraEm = horasDepois(8)): SessaoAutenticada {
  return {
    token,
    expiraEm,
    usuario: { id: "u1", nome: "Ana", email: "ana@volta.test", papel: "responsavel_pgrs", unidade: "Lins" },
  };
}

let local: Storage;
let sessao: Storage;

beforeEach(() => {
  local = armazemFalso();
  sessao = armazemFalso();
  vi.stubGlobal("localStorage", local);
  vi.stubGlobal("sessionStorage", sessao);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sessão guardada", () => {
  it("sem nada guardado, não há sessão", () => {
    expect(lerSessaoGuardada(AGORA)).toBeNull();
  });

  it("com Manter conectado, a sessão fica no localStorage e a aba não guarda cópia", () => {
    guardarSessao(sessaoDe("t-local"), "local");
    expect(carregar(CHAVE_DA_SESSAO, 1, "local")).not.toBeNull();
    expect(carregar(CHAVE_DA_SESSAO, 1, "sessao")).toBeNull();
    expect(lerSessaoGuardada(AGORA)).toMatchObject({ onde: "local", sessao: { token: "t-local" } });
  });

  it("sem Manter conectado, a sessão fica só no sessionStorage e nada vai ao localStorage", () => {
    guardarSessao(sessaoDe("t-aba"), "sessao");
    expect(local.length).toBe(0);
    expect(lerSessaoGuardada(AGORA)).toMatchObject({ onde: "sessao", sessao: { token: "t-aba" } });
  });

  it("ao fechar o navegador (o sessionStorage some), a sessão da aba some e a do localStorage fica", () => {
    guardarSessao(sessaoDe("t-aba"), "sessao");
    sessao.clear();
    expect(lerSessaoGuardada(AGORA)).toBeNull();

    guardarSessao(sessaoDe("t-local"), "local");
    sessao.clear();
    expect(lerSessaoGuardada(AGORA)?.sessao.token).toBe("t-local");
  });

  it("trocar de lugar apaga a cópia do outro, para não sobrar sessão esquecida", () => {
    guardarSessao(sessaoDe("t1"), "local");
    guardarSessao(sessaoDe("t2"), "sessao");
    expect(local.length).toBe(0);
    expect(lerSessaoGuardada(AGORA)).toMatchObject({ onde: "sessao", sessao: { token: "t2" } });

    guardarSessao(sessaoDe("t3"), "local");
    expect(sessao.length).toBe(0);
    expect(lerSessaoGuardada(AGORA)).toMatchObject({ onde: "local", sessao: { token: "t3" } });
  });

  it("ignora a sessão vencida", () => {
    guardarSessao(sessaoDe("t-velha", horasDepois(-1)), "local");
    expect(lerSessaoGuardada(AGORA)).toBeNull();
  });

  it("se a do localStorage venceu, ainda usa a válida da aba", () => {
    guardarSessao(sessaoDe("t-velha", horasDepois(-1)), "local");
    // guardarSessao apaga a cópia do outro lugar; a da aba é escrita à mão para este caso raro.
    sessao.setItem(CHAVE_DA_SESSAO, JSON.stringify({ _versao: 1, dados: sessaoDe("t-aba") }));
    expect(lerSessaoGuardada(AGORA)).toMatchObject({ onde: "sessao", sessao: { token: "t-aba" } });
  });

  it("no caso raro de existir nos dois lugares, vale a do localStorage (a que sobrevive ao navegador)", () => {
    local.setItem(CHAVE_DA_SESSAO, JSON.stringify({ _versao: 1, dados: sessaoDe("t-local") }));
    sessao.setItem(CHAVE_DA_SESSAO, JSON.stringify({ _versao: 1, dados: sessaoDe("t-aba") }));
    expect(lerSessaoGuardada(AGORA)).toMatchObject({ onde: "local", sessao: { token: "t-local" } });
  });

  it("esquecer apaga dos dois lugares", () => {
    local.setItem(CHAVE_DA_SESSAO, JSON.stringify({ _versao: 1, dados: sessaoDe("a") }));
    sessao.setItem(CHAVE_DA_SESSAO, JSON.stringify({ _versao: 1, dados: sessaoDe("b") }));
    esquecerSessao();
    expect(local.length + sessao.length).toBe(0);
  });
});
