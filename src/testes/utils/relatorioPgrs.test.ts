import { describe, expect, it } from "vitest";

import { criarOcorrencia } from "../fabricas";
import type { ColetaApi } from "../../types/api";
import {
  calcularRelatorio,
  intervaloAnterior,
  intervaloDoPeriodo,
  rotuloDoAnterior,
} from "../../utils/relatorioPgrs";
import type { EntradaRelatorio } from "../../utils/relatorioPgrs";

/** Quinta-feira, 19/11/2026, às 15h. */
const AGORA = new Date(2026, 10, 19, 15);
const em = (mes: number, dia: number, hora = 9): string => new Date(2026, mes, dia, hora).toISOString();

function entrada(parcial: Partial<EntradaRelatorio> = {}): EntradaRelatorio {
  return {
    ocorrencias: [],
    metricas: [],
    scoreEsg: null,
    posicaoNoRanking: null,
    coletas: [],
    nomesCooperativas: new Map(),
    ...parcial,
  };
}

function coleta(parcial: Partial<ColetaApi>): ColetaApi {
  return {
    id: "col-1",
    incidentId: "occ-1",
    cooperativeId: "coop-1",
    requestedAt: "2026-11-10T12:00:00",
    scheduledAt: null,
    currentStatus: "COMPLETED",
    collectionType: "PICKUP",
    urgent: false,
    ...parcial,
  };
}

describe("intervalos do período", () => {
  it("o mês, o trimestre (com o atual) e o ano do calendário", () => {
    const mes = intervaloDoPeriodo("mes", AGORA);
    expect([new Date(mes.de).getMonth(), new Date(mes.ate).getMonth()]).toEqual([10, 11]);
    expect(new Date(intervaloDoPeriodo("trimestre", AGORA).de).getMonth()).toBe(8);
    const ano = intervaloDoPeriodo("ano", AGORA);
    expect([new Date(ano.de).getMonth(), new Date(ano.ate).getFullYear()]).toEqual([0, 2027]);
  });

  it("o período anterior termina onde o atual começa", () => {
    for (const periodo of ["mes", "trimestre", "ano"] as const) {
      expect(intervaloAnterior(periodo, AGORA).ate).toBe(intervaloDoPeriodo(periodo, AGORA).de);
    }
    expect(new Date(intervaloAnterior("mes", AGORA).de).getMonth()).toBe(9);
    expect(new Date(intervaloAnterior("trimestre", AGORA).de).getMonth()).toBe(5);
    expect(new Date(intervaloAnterior("ano", AGORA).de).getFullYear()).toBe(2025);
  });

  it("o rótulo do anterior cita o mês, o trimestre ou o ano", () => {
    expect(rotuloDoAnterior("mes", intervaloAnterior("mes", AGORA))).toBe("outubro de 2026");
    expect(rotuloDoAnterior("trimestre", intervaloAnterior("trimestre", AGORA))).toBe("o trimestre anterior");
    expect(rotuloDoAnterior("ano", intervaloAnterior("ano", AGORA))).toBe("2025");
  });
});

describe("calcularRelatorio: o que o documento do PGRS usa", () => {
  const ocorrencias = [
    criarOcorrencia({ id: "a", codigo: "#0001", titulo: "Papelão molhado", pesoKg: 100, material: "papelao", criadaEm: em(10, 3), criadaPorNome: "Ana", localizacao: { setor: "Expedição", unidade: "U" } }),
    criarOcorrencia({ id: "b", codigo: "#0002", titulo: "Papelão molhado", pesoKg: 60, material: "papelao", criadaEm: em(10, 8), criadaPorNome: "Bruno", localizacao: { setor: "Expedição", unidade: "U" } }),
    criarOcorrencia({ id: "c", codigo: "#0003", titulo: "Garrafa PET", pesoKg: 40, material: "plastico", criadaEm: em(10, 12), criadaPorNome: "Carla", localizacao: { setor: "Refeitório", unidade: "U" } }),
    criarOcorrencia({ id: "d", codigo: "#0004", titulo: "Vidro", pesoKg: 30, material: "vidro", status: "classificada", criadaEm: em(10, 15), localizacao: { setor: "Laboratório", unidade: "U" } }),
    criarOcorrencia({ id: "e", codigo: "#0005", titulo: "Metal", pesoKg: 20, material: "metal", status: "recusada", criadaEm: em(10, 16), localizacao: { setor: "Laboratório", unidade: "U" } }),
    criarOcorrencia({ id: "f", codigo: "#0006", titulo: "Sucata", pesoKg: 50, material: "metal", criadaEm: em(10, 17), criadaPorNome: "Davi", localizacao: { setor: "Manutenção", unidade: "U" } }),
    criarOcorrencia({ id: "g", codigo: "#0007", titulo: "Papelão", pesoKg: 80, material: "papelao", criadaEm: em(9, 20), localizacao: { setor: "Expedição", unidade: "U" } }),
  ];
  const relatorio = calcularRelatorio("mes", entrada({ ocorrencias }), AGORA);

  it("compara com o mês anterior", () => {
    expect(relatorio.anterior).toEqual({
      rotulo: "outubro de 2026",
      ocorrencias: 1,
      recuperadoKg: 80,
      taxaAprovacao: 100,
    });
  });

  it("sem ocorrência no período anterior, não há comparação", () => {
    const so = calcularRelatorio("mes", entrada({ ocorrencias: ocorrencias.slice(0, 6) }), AGORA);
    expect(so.anterior).toBeNull();
  });

  it("lista todos os setores do que foi aprovado, do maior para o menor", () => {
    expect(relatorio.setoresRecuperados).toEqual([
      { nome: "Expedição", kg: 160 },
      { nome: "Manutenção", kg: 50 },
      { nome: "Refeitório", kg: 40 },
    ]);
  });

  it("separa as aprovadas mais recentes, da mais nova para a mais antiga", () => {
    expect(relatorio.aprovadasRecentes?.map((item) => item.codigo)).toEqual(["#0006", "#0003", "#0002", "#0001"]);
    expect(relatorio.aprovadasRecentes?.[0]).toEqual({
      id: "f",
      codigo: "#0006",
      titulo: "Sucata",
      setor: "Manutenção",
      material: "metal",
      pesoKg: 50,
      registradaPor: "Davi",
    });
  });

  it("limita a amostra a quatro ocorrências", () => {
    const muitas = Array.from({ length: 9 }, (_, indice) =>
      criarOcorrencia({ id: `o${indice}`, codigo: `#${indice}`, criadaEm: em(10, 1 + indice) }),
    );
    expect(calcularRelatorio("mes", entrada({ ocorrencias: muitas }), AGORA).aprovadasRecentes).toHaveLength(4);
  });

  it("acha o que mais se repetiu no mesmo setor, contando as ocorrências de qualquer status", () => {
    expect(relatorio.recorrencia).toEqual({ setor: "Expedição", titulo: "Papelão molhado", vezes: 2 });
  });

  it("sem repetição, não há recorrência", () => {
    const sem = calcularRelatorio("mes", entrada({ ocorrencias: [ocorrencias[2], ocorrencias[5]] }), AGORA);
    expect(sem.recorrencia).toBeNull();
  });
});

describe("destinação por cooperativa com peso e materiais", () => {
  const ocorrencias = [
    criarOcorrencia({ id: "a", pesoKg: 60, material: "papelao", criadaEm: em(10, 3) }),
    criarOcorrencia({ id: "b", pesoKg: 40, material: "plastico", criadaEm: em(10, 4) }),
    criarOcorrencia({ id: "c", pesoKg: 100, material: "papelao", criadaEm: em(10, 5) }),
  ];
  const coletas = [
    coleta({ id: "1", incidentId: "a", cooperativeId: "coop-1" }),
    coleta({ id: "2", incidentId: "b", cooperativeId: "coop-1" }),
    coleta({ id: "3", incidentId: "c", cooperativeId: "coop-2" }),
    coleta({ id: "4", incidentId: "c", cooperativeId: "coop-3", currentStatus: "CANCELED" }),
  ];
  const relatorio = calcularRelatorio(
    "mes",
    entrada({
      ocorrencias,
      coletas,
      nomesCooperativas: new Map([["coop-1", "Recicla Vida"], ["coop-2", "JBS Ambiental"]]),
    }),
    AGORA,
  );

  it("soma os quilos de cada cooperativa e ignora a coleta cancelada", () => {
    expect(relatorio.destinacao.map((item) => [item.nome, item.kg, item.percentual])).toEqual([
      ["Recicla Vida", 100, 50],
      ["JBS Ambiental", 100, 50],
    ]);
  });

  it("junta os materiais das ocorrências que a cooperativa coletou, na ordem dos materiais", () => {
    const recicla = relatorio.destinacao.find((item) => item.nome === "Recicla Vida");
    expect(recicla?.materiais).toEqual(["papelao", "plastico"]);
    expect(relatorio.destinacao.find((item) => item.nome === "JBS Ambiental")?.materiais).toEqual(["papelao"]);
  });
});
