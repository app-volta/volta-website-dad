import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NotificacaoApi } from "../../types/api";

const requisitar = vi.fn();
let aoEncerrar: () => void = () => undefined;

/** Carrega o módulo do zero, porque a lista que ele guarda vive no próprio módulo. */
async function carregar(usarMocks = false): Promise<typeof import("../../services/notificacoesApi")> {
  vi.resetModules();
  vi.doMock("../../services/http", () => ({
    USAR_MOCKS: usarMocks,
    requisitar,
    aoEncerrarSessao: (limpar: () => void) => {
      aoEncerrar = limpar;
      return () => undefined;
    },
  }));
  return import("../../services/notificacoesApi");
}

const item = (id: string, read = false): NotificacaoApi => ({
  id,
  type: "INCIDENT",
  title: "Ocorrência registrada",
  message: `Mensagem ${id}`,
  read,
  createdAt: "2026-11-18T10:00:00",
});

beforeEach(() => {
  requisitar.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("lista de notificações da API", () => {
  it("começa sem resposta e guarda o que a API devolve", async () => {
    requisitar.mockResolvedValueOnce([item("a"), item("b")]);
    const api = await carregar();
    expect(api.lerNotificacoesDaApi()).toBeNull();
    await api.recarregarNotificacoesDaApi();
    expect(api.lerNotificacoesDaApi()).toEqual([item("a"), item("b")]);
    expect(requisitar).toHaveBeenCalledWith("/notifications", { sinal: undefined });
  });

  it("sem a rota ou sem resposta na primeira vez, fica indisponível; a próxima que der certo assume", async () => {
    requisitar.mockRejectedValueOnce(new Error("404")).mockResolvedValueOnce([item("a")]);
    const api = await carregar();
    await api.recarregarNotificacoesDaApi();
    expect(api.lerNotificacoesDaApi()).toBe("indisponivel");
    await api.recarregarNotificacoesDaApi();
    expect(api.lerNotificacoesDaApi()).toEqual([item("a")]);
  });

  it("uma falha depois de a lista chegar não a apaga", async () => {
    requisitar.mockResolvedValueOnce([item("a")]).mockRejectedValueOnce(new Error("502"));
    const api = await carregar();
    await api.recarregarNotificacoesDaApi();
    await api.recarregarNotificacoesDaApi();
    expect(api.lerNotificacoesDaApi()).toEqual([item("a")]);
  });

  it("uma busca cancelada que falha não marca como indisponível", async () => {
    requisitar.mockRejectedValueOnce(new Error("cancelada"));
    const api = await carregar();
    const controle = new AbortController();
    controle.abort();
    await api.recarregarNotificacoesDaApi(controle.signal);
    expect(api.lerNotificacoesDaApi()).toBeNull();
  });

  it("ao sair, esquece a lista da pessoa anterior", async () => {
    requisitar.mockResolvedValueOnce([item("a")]);
    const api = await carregar();
    await api.recarregarNotificacoesDaApi();
    aoEncerrar();
    expect(api.lerNotificacoesDaApi()).toBeNull();
  });
});

describe("marcar como lida", () => {
  it("muda na hora e avisa a API", async () => {
    requisitar.mockResolvedValueOnce([item("a"), item("b")]).mockResolvedValueOnce(undefined);
    const api = await carregar();
    await api.recarregarNotificacoesDaApi();
    api.marcarNotificacaoDaApiComoLida("a");
    expect(api.lerNotificacoesDaApi()).toEqual([item("a", true), item("b")]);
    expect(requisitar).toHaveBeenLastCalledWith("/notifications/a/read", { metodo: "PATCH" });
  });

  it("não chama a API para a que já estava lida nem para um id que não é dela", async () => {
    requisitar.mockResolvedValueOnce([item("a", true)]);
    const api = await carregar();
    await api.recarregarNotificacoesDaApi();
    api.marcarNotificacaoDaApiComoLida("a");
    api.marcarNotificacaoDaApiComoLida("meta-mes");
    expect(requisitar).toHaveBeenCalledTimes(1);
  });

  it("se a API recusar, a lista volta ao que o servidor tem", async () => {
    requisitar
      .mockResolvedValueOnce([item("a")])
      .mockRejectedValueOnce(new Error("500"))
      .mockResolvedValueOnce([item("a")]);
    const api = await carregar();
    await api.recarregarNotificacoesDaApi();
    api.marcarNotificacaoDaApiComoLida("a");
    expect(api.lerNotificacoesDaApi()).toEqual([item("a", true)]);
    await vi.waitFor(() => expect(api.lerNotificacoesDaApi()).toEqual([item("a")]));
  });

  it("marcar todas muda tudo de uma vez e faz uma chamada só", async () => {
    requisitar.mockResolvedValueOnce([item("a"), item("b", true), item("c")]).mockResolvedValueOnce(undefined);
    const api = await carregar();
    await api.recarregarNotificacoesDaApi();
    api.marcarNotificacoesDaApiComoLidas();
    expect(api.lerNotificacoesDaApi()).toEqual([item("a", true), item("b", true), item("c", true)]);
    expect(requisitar).toHaveBeenCalledTimes(2);
    expect(requisitar).toHaveBeenLastCalledWith("/notifications/read-all", { metodo: "PATCH" });
  });

  it("marcar todas não chama a API quando não há nada novo nem lista", async () => {
    const api = await carregar();
    api.marcarNotificacoesDaApiComoLidas();
    requisitar.mockResolvedValueOnce([item("a", true)]);
    await api.recarregarNotificacoesDaApi();
    api.marcarNotificacoesDaApiComoLidas();
    expect(requisitar).toHaveBeenCalledTimes(1);
  });
});

describe("acompanhar as notificações", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("document", { hidden: false });
    requisitar.mockResolvedValue([item("a")]);
  });

  it("busca na hora e a cada minuto, até a pessoa sair da tela", async () => {
    const api = await carregar();
    const parar = api.acompanharNotificacoesDaApi();
    expect(requisitar).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(requisitar).toHaveBeenCalledTimes(2);
    parar();
    await vi.advanceTimersByTimeAsync(180_000);
    expect(requisitar).toHaveBeenCalledTimes(2);
  });

  it("não busca com a aba escondida", async () => {
    const api = await carregar();
    const parar = api.acompanharNotificacoesDaApi();
    vi.stubGlobal("document", { hidden: true });
    await vi.advanceTimersByTimeAsync(120_000);
    expect(requisitar).toHaveBeenCalledTimes(1);
    parar();
  });

  it("com os mocks, não faz nenhuma chamada", async () => {
    const api = await carregar(true);
    const parar = api.acompanharNotificacoesDaApi();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(requisitar).not.toHaveBeenCalled();
    parar();
  });
});
