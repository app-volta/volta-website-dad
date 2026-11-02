import { describe, expect, it } from "vitest";

import { instanteUtc } from "./datas";
import { formatarAtividade, nomeDoEmail, validarEmailConvite } from "./equipe";
import { iniciais, rotuloDoPapel } from "./pessoa";

describe("iniciais", () => {
  it("pega a primeira e a última inicial", () => {
    expect(iniciais("Ana Souza")).toBe("AS");
    expect(iniciais("ana maria de souza")).toBe("AS");
  });

  it("com um nome só, uma letra; sem nome, ponto de interrogação", () => {
    expect(iniciais("Ana")).toBe("A");
    expect(iniciais("   ")).toBe("?");
    expect(iniciais("")).toBe("?");
  });
});

describe("rotuloDoPapel", () => {
  it("escreve o papel como aparece no perfil", () => {
    expect(rotuloDoPapel("responsavel_pgrs")).toBe("Gestor · Responsável PGRS");
    expect(rotuloDoPapel("operador")).toBe("Operador");
  });
});

describe("instanteUtc", () => {
  it("trata data sem fuso como UTC, como o backend serializa", () => {
    expect(instanteUtc("2026-11-18T10:00:00")).toBe("2026-11-18T10:00:00.000Z");
  });

  it("respeita o fuso quando ele vem", () => {
    expect(instanteUtc("2026-11-18T10:00:00Z")).toBe("2026-11-18T10:00:00.000Z");
    expect(instanteUtc("2026-11-18T10:00:00-03:00")).toBe("2026-11-18T13:00:00.000Z");
  });

  it("devolve o texto original quando não é uma data", () => {
    expect(instanteUtc("ontem")).toBe("ontem");
  });
});

describe("formatarAtividade", () => {
  const agora = new Date(2026, 10, 18, 15);
  const atras = (minutos: number): string => new Date(agora.getTime() - minutos * 60_000).toISOString();

  it("diz 'agora' no primeiro minuto e conta em minutos na primeira hora", () => {
    expect(formatarAtividade(atras(0), agora)).toBe("agora");
    expect(formatarAtividade(atras(12), agora)).toBe("há 12 min");
  });

  it("conta em horas no mesmo dia, depois ontem e dias", () => {
    expect(formatarAtividade(atras(2 * 60), agora)).toBe("há 2 h");
    expect(formatarAtividade(new Date(2026, 10, 17, 22).toISOString(), agora)).toBe("ontem");
    expect(formatarAtividade(new Date(2026, 10, 15, 10).toISOString(), agora)).toBe("há 3 dias");
  });
});

describe("nomeDoEmail", () => {
  it("transforma a parte local do e-mail em nome", () => {
    expect(nomeDoEmail("joana.silva@volta.com")).toBe("Joana Silva");
    expect(nomeDoEmail("JOANA_silva-souza@volta.com")).toBe("Joana Silva Souza");
  });
});

describe("validarEmailConvite", () => {
  it("pede o e-mail da pessoa e reaproveita a regra de formato", () => {
    expect(validarEmailConvite(" ")).toBe("Informe o e-mail da pessoa.");
    expect(validarEmailConvite("joana")).toBe("E-mail em formato inválido.");
    expect(validarEmailConvite("joana@volta.com")).toBeNull();
  });
});
