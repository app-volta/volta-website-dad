import { describe, expect, it } from "vitest";

import { criarOcorrencia, criarPreferenciasDaMeta } from "../fabricas";
import { MATERIAIS } from "../../types/material";
import type { Material } from "../../types/material";
import {
  avisosDaMeta,
  chaveDoDia,
  chaveDoMes,
  distribuirMeta,
  diasDeOperacaoDoMes,
  diasDeOperacaoPadrao,
  divisaoInicial,
  mensagemDaSomaDiferente,
  metaDoDiaKg,
  partesDasMetas,
  recuperadoHojeKg,
  somaDasMetas,
  validarDias,
  validarValorFixoDoDia,
} from "../../utils/metas";

function porMaterial(valores: Partial<Record<Material, number>>): Record<Material, number> {
  return { papelao: 0, plastico: 0, metal: 0, vidro: 0, ...valores };
}

/** Quarta-feira, 18/11/2026, às 15h: 14 dos 25 dias de operação do mês já passaram. */
const QUARTA = new Date(2026, 10, 18, 15);

describe("chaves de mês e de dia", () => {
  it("usa o horário local e completa com zero", () => {
    expect(chaveDoMes(new Date(2026, 0, 5))).toBe("2026-01");
    expect(chaveDoDia(new Date(2026, 10, 3))).toBe("2026-11-03");
    expect(chaveDoDia(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });
});

describe("dias de operação", () => {
  it("conta de segunda a sábado no mês", () => {
    expect(diasDeOperacaoPadrao(new Date(2026, 10, 15))).toBe(25);
    expect(diasDeOperacaoPadrao(new Date(2026, 1, 10))).toBe(24);
  });

  it("usa o que a pessoa salvou só no mês em que salvou", () => {
    const salvo = { mes: "2026-11", dias: 20 };
    expect(diasDeOperacaoDoMes(salvo, new Date(2026, 10, 15))).toBe(20);
    expect(diasDeOperacaoDoMes(salvo, new Date(2026, 11, 15))).toBe(
      diasDeOperacaoPadrao(new Date(2026, 11, 15)),
    );
    expect(diasDeOperacaoDoMes(null, new Date(2026, 10, 15))).toBe(25);
  });

  it("aceita de 1 a 31 dias inteiros", () => {
    expect(validarDias(1)).toBeNull();
    expect(validarDias(31)).toBeNull();
    expect(validarDias(0)).toBe("Informe de 1 a 31 dias.");
    expect(validarDias(32)).toBe("Informe de 1 a 31 dias.");
    expect(validarDias(20.5)).toBe("Informe de 1 a 31 dias.");
    expect(validarDias(Number.NaN)).toBe("Informe de 1 a 31 dias.");
  });
});

describe("metaDoDiaKg", () => {
  it("divide a meta do mês pelos dias, arredondando", () => {
    expect(metaDoDiaKg(1500, 25, { modo: "dividir", valorFixoKg: 0 })).toBe(60);
    expect(metaDoDiaKg(1000, 30, { modo: "dividir", valorFixoKg: 0 })).toBe(33);
  });

  it("devolve zero sem dias de operação", () => {
    expect(metaDoDiaKg(1500, 0, { modo: "dividir", valorFixoKg: 0 })).toBe(0);
  });

  it("usa o valor fixo quando a pessoa escolheu um", () => {
    expect(metaDoDiaKg(1500, 25, { modo: "fixo", valorFixoKg: 80 })).toBe(80);
  });
});

describe("validarValorFixoDoDia", () => {
  it("pede um número inteiro de quilos", () => {
    const erro = "Informe quantos quilos por dia, só com números.";
    expect(validarValorFixoDoDia(0, 1500)).toBe(erro);
    expect(validarValorFixoDoDia(Number.NaN, 1500)).toBe(erro);
    expect(validarValorFixoDoDia(12.5, 1500)).toBe(erro);
  });

  it("não deixa a meta do dia passar da meta do mês", () => {
    expect(validarValorFixoDoDia(2000, 1500)).toBe("A meta do dia não pode passar da meta do mês.");
    expect(validarValorFixoDoDia(1500, 1500)).toBeNull();
  });

  it("não compara com a meta do mês enquanto ela é inválida", () => {
    expect(validarValorFixoDoDia(80, Number.NaN)).toBeNull();
  });
});

describe("recuperadoHojeKg", () => {
  const hoje = (hora: number, minuto = 0): string =>
    new Date(2026, 10, 18, hora, minuto).toISOString();

  it("soma só as aprovadas registradas hoje", () => {
    const ocorrencias = [
      criarOcorrencia({ id: "a", pesoKg: 10, criadaEm: hoje(8) }),
      criarOcorrencia({ id: "b", pesoKg: 20, status: "finalizada", criadaEm: hoje(14) }),
      criarOcorrencia({ id: "c", pesoKg: 50, status: "classificada", criadaEm: hoje(9) }),
      criarOcorrencia({ id: "d", pesoKg: 70, criadaEm: new Date(2026, 10, 17, 23, 59).toISOString() }),
    ];
    expect(recuperadoHojeKg(ocorrencias, QUARTA)).toBe(30);
  });

  it("conta a meia-noite de hoje e deixa de fora a de amanhã", () => {
    const ocorrencias = [
      criarOcorrencia({ id: "a", pesoKg: 5, criadaEm: hoje(0, 0) }),
      criarOcorrencia({ id: "b", pesoKg: 9, criadaEm: new Date(2026, 10, 19, 0, 0).toISOString() }),
    ];
    expect(recuperadoHojeKg(ocorrencias, QUARTA)).toBe(5);
  });
});

describe("meta por material", () => {
  it("soma as metas e ignora o campo em branco", () => {
    expect(somaDasMetas(porMaterial({ papelao: 600, plastico: 400 }))).toBe(1000);
    expect(somaDasMetas(porMaterial({ papelao: Number.NaN, plastico: 400 }))).toBe(400);
  });

  it("divide em partes iguais quando não há base", () => {
    const partes = partesDasMetas({});
    for (const material of MATERIAIS) expect(partes[material]).toBe(0.25);
  });

  it("divide pelo peso de cada material e ignora valores negativos", () => {
    const partes = partesDasMetas({ papelao: 50, plastico: 50, metal: -10 });
    expect(partes).toEqual({ papelao: 0.5, plastico: 0.5, metal: 0, vidro: 0 });
  });

  it("distribui a meta fechando a soma exatamente", () => {
    const partes = { papelao: 0.5, plastico: 0.3, metal: 0.2, vidro: 0 };
    expect(distribuirMeta(1000, partes)).toEqual({
      papelao: 500,
      plastico: 300,
      metal: 200,
      vidro: 0,
    });
    // Os quilos que sobram do arredondamento vão para o maior material.
    expect(distribuirMeta(1001, partes).papelao).toBe(501);
  });

  it("fecha a soma para qualquer meta, em partes desiguais ou iguais", () => {
    const desiguais = { papelao: 0.37, plastico: 0.29, metal: 0.21, vidro: 0.13 };
    const iguais = partesDasMetas({});
    for (let meta = 1; meta <= 300; meta += 1) {
      expect(somaDasMetas(distribuirMeta(meta, desiguais))).toBe(meta);
      expect(somaDasMetas(distribuirMeta(meta, iguais))).toBe(meta);
    }
  });
});

describe("divisaoInicial", () => {
  const recuperado = porMaterial({ papelao: 300, plastico: 100, metal: 100 });

  it("sem divisão salva, divide a meta pelo que cada material já recuperou", () => {
    const { valores } = divisaoInicial(1000, null, recuperado);
    expect(valores).toEqual({ papelao: 600, plastico: 200, metal: 200, vidro: 0 });
  });

  it("mantém a divisão salva enquanto ela fecha a meta do mês", () => {
    const salva = porMaterial({ papelao: 400, plastico: 300, metal: 200, vidro: 100 });
    const { valores } = divisaoInicial(1000, salva, recuperado);
    expect(valores).toEqual(salva);
    expect(valores).not.toBe(salva);
  });

  it("refaz a divisão salva nas mesmas partes quando a meta do mês mudou", () => {
    const salva = porMaterial({ papelao: 400, plastico: 300, metal: 200, vidro: 100 });
    const { valores } = divisaoInicial(2000, salva, recuperado);
    expect(valores).toEqual({ papelao: 800, plastico: 600, metal: 400, vidro: 200 });
  });

  it("não divide nada enquanto a meta do mês é zero", () => {
    expect(divisaoInicial(0, null, recuperado).valores).toBeNull();
  });
});

describe("mensagemDaSomaDiferente", () => {
  it("diz quanto a soma passa da meta", () => {
    expect(mensagemDaSomaDiferente(1600, 1500)).toBe(
      "A soma dá 1.600 kg, 100 kg acima da meta do mês (1.500 kg).",
    );
  });

  it("diz quanto falta para a meta", () => {
    expect(mensagemDaSomaDiferente(1400, 1500)).toBe(
      "A soma dá 1.400 kg, 100 kg abaixo da meta do mês (1.500 kg).",
    );
  });
});

describe("avisosDaMeta", () => {
  const semAvisos = { metaDoDiaBatida: null, foraDoRitmo: null };
  const aprovadaHoje = (pesoKg: number) =>
    criarOcorrencia({ pesoKg, criadaEm: new Date(2026, 10, 18, 9).toISOString() });
  const aprovadaNoDia = (dia: number, pesoKg: number) =>
    criarOcorrencia({ id: `d${dia}`, pesoKg, criadaEm: new Date(2026, 10, dia, 9).toISOString() });
  const soMetaDoDia = criarPreferenciasDaMeta({
    avisosDaMeta: { incluirNoPgrs: true, mostrarNoInicio: true, avisarMetaDoDia: true, alertarRitmo: false },
  });
  const soRitmo = criarPreferenciasDaMeta({
    avisosDaMeta: { incluirNoPgrs: true, mostrarNoInicio: true, avisarMetaDoDia: false, alertarRitmo: true },
  });

  it("não avisa nada sem meta do mês", () => {
    expect(avisosDaMeta([aprovadaHoje(500)], 0, criarPreferenciasDaMeta(), QUARTA)).toEqual(semAvisos);
  });

  describe("meta do dia", () => {
    it("avisa quando o recuperado de hoje chega à meta (1.500 kg em 25 dias dá 60 kg)", () => {
      const avisos = avisosDaMeta([aprovadaHoje(60)], 1500, soMetaDoDia, QUARTA);
      expect(avisos.metaDoDiaBatida).toEqual({ hojeKg: 60, metaDoDiaKg: 60 });
    });

    it("não avisa um quilo antes da meta", () => {
      expect(avisosDaMeta([aprovadaHoje(59)], 1500, soMetaDoDia, QUARTA).metaDoDiaBatida).toBeNull();
    });

    it("respeita o interruptor desligado", () => {
      const preferencias = criarPreferenciasDaMeta({
        avisosDaMeta: { incluirNoPgrs: true, mostrarNoInicio: true, avisarMetaDoDia: false, alertarRitmo: false },
      });
      expect(avisosDaMeta([aprovadaHoje(500)], 1500, preferencias, QUARTA)).toEqual(semAvisos);
    });

    it("usa os dias de operação e a meta fixa escolhidos", () => {
      const comDias = criarPreferenciasDaMeta({
        ...soMetaDoDia,
        diasDeOperacao: { mes: "2026-11", dias: 15 },
      });
      expect(avisosDaMeta([aprovadaHoje(100)], 1500, comDias, QUARTA).metaDoDiaBatida?.metaDoDiaKg).toBe(100);

      const fixa = criarPreferenciasDaMeta({
        ...soMetaDoDia,
        metaDoDia: { modo: "fixo", valorFixoKg: 80 },
      });
      expect(avisosDaMeta([aprovadaHoje(79)], 1500, fixa, QUARTA).metaDoDiaBatida).toBeNull();
      expect(avisosDaMeta([aprovadaHoje(80)], 1500, fixa, QUARTA).metaDoDiaBatida).not.toBeNull();
    });
  });

  describe("ritmo do mês", () => {
    it("alerta quando o mês está mais de 10 pontos atrás dos dias passados", () => {
      // Dia 18: 14 dos 25 dias já passaram (56%); 300 de 1.500 kg é 20%.
      const avisos = avisosDaMeta([aprovadaNoDia(5, 300)], 1500, soRitmo, QUARTA);
      expect(avisos.foraDoRitmo).toEqual({ atingidoPct: 20, esperadoPct: 56 });
    });

    it("alerta já com 16 pontos de atraso, sem esperar uma diferença maior", () => {
      // 600 de 1.500 kg é 40%; o esperado é 56%.
      const avisos = avisosDaMeta([aprovadaNoDia(5, 600)], 1500, soRitmo, QUARTA);
      expect(avisos.foraDoRitmo).toEqual({ atingidoPct: 40, esperadoPct: 56 });
    });

    it("não alerta dentro da folga de 10 pontos", () => {
      // 46% é o limite: 700 kg de 1.500 é 47%, ainda dentro da folga.
      expect(avisosDaMeta([aprovadaNoDia(5, 700)], 1500, soRitmo, QUARTA).foraDoRitmo).toBeNull();
    });

    it("não alerta no começo do mês, quando o ritmo ainda não diz nada", () => {
      const terca3 = new Date(2026, 10, 3, 15);
      expect(avisosDaMeta([], 1500, soRitmo, terca3).foraDoRitmo).toBeNull();
    });

    it("respeita o interruptor desligado", () => {
      expect(avisosDaMeta([aprovadaNoDia(5, 300)], 1500, soMetaDoDia, QUARTA).foraDoRitmo).toBeNull();
    });
  });
});
