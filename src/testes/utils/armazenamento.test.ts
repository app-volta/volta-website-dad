import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { carregar, remover, salvar } from "../../utils/armazenamento";

/** Um Storage de mentira: os testes rodam em Node, que não tem localStorage nem sessionStorage. */
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

describe("armazenamento versionado", () => {
  it("guarda e devolve o valor, por padrão no localStorage", () => {
    salvar("chave", 1, { a: 1 });
    expect(carregar("chave", 1)).toEqual({ a: 1 });
    expect(local.getItem("chave")).not.toBeNull();
    expect(sessao.getItem("chave")).toBeNull();
  });

  it("com onde = sessao, usa o sessionStorage e deixa o localStorage em paz", () => {
    salvar("chave", 1, "da aba", "sessao");
    expect(carregar("chave", 1, "sessao")).toBe("da aba");
    expect(carregar("chave", 1, "local")).toBeNull();
    expect(local.length).toBe(0);
  });

  it("descarta, e apaga, o que foi guardado com outra versão", () => {
    salvar("chave", 1, "antigo");
    expect(carregar("chave", 2)).toBeNull();
    expect(local.getItem("chave")).toBeNull();
  });

  it("um valor que não é JSON vira vazio em vez de quebrar", () => {
    local.setItem("chave", "{quebrado");
    expect(carregar("chave", 1)).toBeNull();
  });

  it("remover apaga só do lugar indicado", () => {
    salvar("chave", 1, "x", "local");
    salvar("chave", 1, "y", "sessao");
    remover("chave", "sessao");
    expect(carregar("chave", 1, "local")).toBe("x");
    expect(carregar("chave", 1, "sessao")).toBeNull();
  });

  it("se o navegador recusar guardar (modo privado, cota cheia), não quebra a tela", () => {
    vi.stubGlobal("localStorage", {
      ...local,
      setItem: () => {
        throw new Error("cota cheia");
      },
    });
    expect(() => salvar("chave", 1, "x")).not.toThrow();
  });
});
