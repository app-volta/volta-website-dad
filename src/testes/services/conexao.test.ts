import { afterEach, describe, expect, it, vi } from "vitest";

import { confirmarConexao } from "../../services/conexao";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("confirmarConexao", () => {
  it("pede a própria página, sem cache, e diz que há internet quando ela responde", async () => {
    const pedir = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", pedir);
    await expect(confirmarConexao()).resolves.toBe(true);
    expect(pedir).toHaveBeenCalledWith("/", expect.objectContaining({ method: "HEAD", cache: "no-store" }));
  });

  it("mesmo com uma resposta de erro do servidor, a internet existe (a página respondeu)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(confirmarConexao()).resolves.toBe(true);
  });

  it("sem resposta (rede caída ou tempo esgotado), diz que não há internet e não rejeita", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(confirmarConexao()).resolves.toBe(false);
  });

  it("dá um tempo limite à espera", async () => {
    const pedir = vi.fn().mockResolvedValue(new Response(null));
    vi.stubGlobal("fetch", pedir);
    await confirmarConexao();
    const opcoes = pedir.mock.calls[0][1] as RequestInit;
    expect(opcoes.signal).toBeInstanceOf(AbortSignal);
  });
});
