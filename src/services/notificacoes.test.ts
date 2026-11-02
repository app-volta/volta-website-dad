import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { criarOcorrencia } from "../testes/fabricas";
import type { AvisosCalculados } from "../utils/metas";
import {
  assinarNotificacoes,
  lerNotificacoesLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  montarNotificacoes,
} from "./notificacoes";

// Com a API, as notificações são montadas das ocorrências; com os mocks, vêm de modelos fixos.
vi.mock("./http", () => ({ USAR_MOCKS: false }));

const AGORA = new Date(2026, 10, 18, 15);
const SEM_AVISOS: AvisosCalculados = { metaDoDiaBatida: null, foraDoRitmo: null };
const NINGUEM_LEU: ReadonlySet<string> = new Set();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(AGORA);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("notificações montadas da API", () => {
  it("não tem nada para mostrar sem ocorrências", () => {
    expect(montarNotificacoes(NINGUEM_LEU, 0, [], 1500, true, SEM_AVISOS, AGORA)).toEqual([]);
  });

  it("avisa da fila de aprovação, no singular e no plural", () => {
    const [uma] = montarNotificacoes(NINGUEM_LEU, 1, [criarOcorrencia({ status: "classificada" })], 0, true, SEM_AVISOS, AGORA);
    expect(uma.id).toBe("fila-aguardando");
    expect(uma.trechos).toEqual([
      { texto: "1 ocorrência", destaque: true },
      { texto: " aguardando sua aprovação" },
    ]);
    const [varias] = montarNotificacoes(NINGUEM_LEU, 3, [criarOcorrencia({ status: "classificada" })], 0, true, SEM_AVISOS, AGORA);
    expect(varias.trechos[0].texto).toBe("3 ocorrências");
  });

  it("para quem não revisa, diz que a aprovação é do gestor", () => {
    const [aviso] = montarNotificacoes(NINGUEM_LEU, 2, [criarOcorrencia({ status: "classificada" })], 0, false, SEM_AVISOS, AGORA);
    expect(aviso.trechos[1].texto).toBe(" aguardando aprovação do gestor");
  });

  it("avisa quanto da meta do mês já foi atingido", () => {
    const ocorrencias = [criarOcorrencia({ pesoKg: 750, criadaEm: new Date(2026, 10, 10).toISOString() })];
    const lista = montarNotificacoes(NINGUEM_LEU, 0, ocorrencias, 1500, true, SEM_AVISOS, AGORA);
    const meta = lista.find((item) => item.id === "meta-mes");
    expect(meta?.trechos).toEqual([
      { texto: "A unidade bateu " },
      { texto: "50% da meta", destaque: true },
      { texto: " do mês" },
    ]);
    expect(meta?.destino).toBe("/relatorios");
  });

  it("não fala da meta quando a empresa não definiu uma", () => {
    const ocorrencias = [criarOcorrencia({ pesoKg: 750, criadaEm: new Date(2026, 10, 10).toISOString() })];
    expect(montarNotificacoes(NINGUEM_LEU, 0, ocorrencias, 0, true, SEM_AVISOS, AGORA)).toEqual([]);
  });

  it("mostra os dois registros mais recentes, com o autor em destaque", () => {
    const evento = (id: string, tipo: "registro" | "aprovacao", em: Date) => ({
      id,
      tipo,
      autor: "Ana Souza",
      texto: "registrou a ocorrência · detalhe",
      em: em.toISOString(),
    });
    const ocorrencia = criarOcorrencia({
      id: "occ-9",
      codigo: "OCC-00009",
      status: "classificada",
      historico: [
        evento("e1", "registro", new Date(2026, 10, 18, 8)),
        evento("e2", "aprovacao", new Date(2026, 10, 18, 14, 55)),
        evento("e3", "registro", new Date(2026, 10, 17, 9)),
      ],
    });
    const lista = montarNotificacoes(NINGUEM_LEU, 0, [ocorrencia], 0, true, SEM_AVISOS, AGORA);
    expect(lista).toHaveLength(2);
    expect(lista[0]).toMatchObject({
      id: "evento-occ-9-e2",
      tipo: "aprovacao",
      quando: "há 5 min",
      destino: "/ocorrencias/occ-9",
    });
    expect(lista[0].trechos).toEqual([
      { texto: "Ana Souza", destaque: true },
      { texto: " registrou a ocorrência OCC-00009" },
    ]);
    expect(lista[1]).toMatchObject({ id: "evento-occ-9-e1", tipo: "fila" });
  });

  it("marca como lidas as que a pessoa já abriu", () => {
    const ocorrencias = [criarOcorrencia({ status: "classificada" })];
    const lista = montarNotificacoes(new Set(["fila-aguardando"]), 1, ocorrencias, 0, true, SEM_AVISOS, AGORA);
    expect(lista.find((item) => item.id === "fila-aguardando")?.lida).toBe(true);
  });
});

describe("avisos da meta nas notificações", () => {
  it("avisa quando a meta de hoje foi batida, com um id por dia", () => {
    const avisos: AvisosCalculados = { metaDoDiaBatida: { hojeKg: 1200, metaDoDiaKg: 60 }, foraDoRitmo: null };
    const [aviso] = montarNotificacoes(NINGUEM_LEU, 0, [], 1500, true, avisos, AGORA);
    expect(aviso).toMatchObject({
      id: "meta-dia-2026-11-18",
      tipo: "meta",
      quando: "hoje",
      destino: "/relatorios/metas",
      lida: false,
    });
    expect(aviso.trechos[2].texto).toBe(" · 1.200 de 60 kg");
  });

  it("alerta quando o mês saiu do ritmo, com um id por mês", () => {
    const avisos: AvisosCalculados = { metaDoDiaBatida: null, foraDoRitmo: { atingidoPct: 20, esperadoPct: 56 } };
    const [aviso] = montarNotificacoes(NINGUEM_LEU, 0, [], 1500, true, avisos, AGORA);
    expect(aviso.id).toBe("meta-ritmo-2026-11");
    expect(aviso.trechos).toEqual([
      { texto: "O mês saiu do ritmo: " },
      { texto: "20% da meta", destaque: true },
      { texto: " com 56% dos dias passados" },
    ]);
  });

  it("volta a avisar no dia seguinte, porque o id muda", () => {
    const avisos: AvisosCalculados = { metaDoDiaBatida: { hojeKg: 80, metaDoDiaKg: 60 }, foraDoRitmo: null };
    const amanha = new Date(2026, 10, 19, 15);
    const lidoOntem = new Set(["meta-dia-2026-11-18"]);
    const [aviso] = montarNotificacoes(lidoOntem, 0, [], 1500, true, avisos, amanha);
    expect(aviso.id).toBe("meta-dia-2026-11-19");
    expect(aviso.lida).toBe(false);
  });

  it("mostra como lida a que a pessoa já abriu", () => {
    const avisos: AvisosCalculados = { metaDoDiaBatida: { hojeKg: 80, metaDoDiaKg: 60 }, foraDoRitmo: null };
    const [aviso] = montarNotificacoes(new Set(["meta-dia-2026-11-18"]), 0, [], 1500, true, avisos, AGORA);
    expect(aviso.lida).toBe(true);
  });
});

describe("notificações lidas", () => {
  it("guarda o que foi lido e avisa quem assina", () => {
    const ouvinte = vi.fn();
    const parar = assinarNotificacoes(ouvinte);
    marcarComoLida("teste-a");
    expect(lerNotificacoesLidas().has("teste-a")).toBe(true);
    expect(ouvinte).toHaveBeenCalledTimes(1);
    parar();
    marcarComoLida("teste-b");
    expect(ouvinte).toHaveBeenCalledTimes(1);
  });

  it("não muda nada ao marcar de novo a que já estava lida", () => {
    marcarComoLida("teste-c");
    const antes = lerNotificacoesLidas();
    marcarComoLida("teste-c");
    expect(lerNotificacoesLidas()).toBe(antes);
  });

  it("marca várias de uma vez sem perder as anteriores", () => {
    marcarComoLida("teste-d");
    marcarTodasComoLidas(["teste-e", "teste-f"]);
    const lidas = lerNotificacoesLidas();
    expect(lidas.has("teste-d")).toBe(true);
    expect(lidas.has("teste-e")).toBe(true);
    expect(lidas.has("teste-f")).toBe(true);
  });
});

describe("notificações de demonstração (modo mock)", () => {
  it("vêm de modelos fixos e só mostram a fila quando há o que aprovar", async () => {
    vi.resetModules();
    vi.doMock("./http", () => ({ USAR_MOCKS: true }));
    const modulo = await import("./notificacoes");

    const semFila = modulo.montarNotificacoes(NINGUEM_LEU, 0, [], 1500, true, SEM_AVISOS, AGORA);
    expect(semFila.map((item) => item.id)).toEqual(["aprovacao-0481", "licenca-recicla-vida", "meta-mes"]);

    const comFila = modulo.montarNotificacoes(NINGUEM_LEU, 3, [], 1500, true, SEM_AVISOS, AGORA);
    expect(comFila.map((item) => item.id)).toContain("fila-aguardando");
    expect(comFila.find((item) => item.id === "fila-aguardando")?.trechos[0].texto).toBe("3 ocorrências");

    vi.doUnmock("./http");
  });

  it("a notificação da meta já vem lida e as outras chegam como novas", async () => {
    vi.resetModules();
    vi.doMock("./http", () => ({ USAR_MOCKS: true }));
    const modulo = await import("./notificacoes");
    const idsLidos = modulo.lerNotificacoesLidas();
    const lista = modulo.montarNotificacoes(idsLidos, 0, [], 1500, true, SEM_AVISOS, AGORA);
    expect(lista.find((item) => item.id === "meta-mes")?.lida).toBe(true);
    expect(lista.find((item) => item.id === "aprovacao-0481")?.lida).toBe(false);
    vi.doUnmock("./http");
  });
});
