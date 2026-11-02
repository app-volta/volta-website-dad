import { describe, expect, it } from "vitest";

import { criarConfiguracoes } from "../fabricas";
import {
  lerQuilos,
  mesclarConfiguracoes,
  percentualDaMeta,
  validarMeta,
} from "../../utils/configuracoes";

describe("mesclarConfiguracoes", () => {
  const atual = criarConfiguracoes();

  it("não muda nada quando a alteração é vazia, e devolve um objeto novo", () => {
    const resultado = mesclarConfiguracoes(atual, {});
    expect(resultado).toEqual(atual);
    expect(resultado).not.toBe(atual);
  });

  it("troca só a meta do mês e mantém o resto", () => {
    const resultado = mesclarConfiguracoes(atual, { metaRecuperacaoKg: 2000 });
    expect(resultado.metaRecuperacaoKg).toBe(2000);
    expect(resultado.unidade).toEqual(atual.unidade);
    expect(resultado.notificacoes).toEqual(atual.notificacoes);
  });

  it("mescla as notificações e os avisos da meta campo a campo", () => {
    const resultado = mesclarConfiguracoes(atual, {
      notificacoes: { resumoSemanal: true },
      avisosDaMeta: { alertarRitmo: true },
    });
    expect(resultado.notificacoes).toEqual({ ...atual.notificacoes, resumoSemanal: true });
    expect(resultado.avisosDaMeta).toEqual({ ...atual.avisosDaMeta, alertarRitmo: true });
  });

  it("guarda a meta do dia escolhida", () => {
    const resultado = mesclarConfiguracoes(atual, {
      metaDoDia: { modo: "fixo", valorFixoKg: 80 },
    });
    expect(resultado.metaDoDia).toEqual({ modo: "fixo", valorFixoKg: 80 });
  });

  it("distingue 'não mexeu' (undefined) de 'apagar' (null) nos dias e na meta por material", () => {
    const comValores = criarConfiguracoes({
      diasDeOperacao: { mes: "2026-11", dias: 20 },
      metaPorMaterial: { papelao: 600, plastico: 400, metal: 300, vidro: 200 },
    });
    const igual = mesclarConfiguracoes(comValores, {});
    expect(igual.diasDeOperacao).toEqual(comValores.diasDeOperacao);
    expect(igual.metaPorMaterial).toEqual(comValores.metaPorMaterial);

    const apagado = mesclarConfiguracoes(comValores, { diasDeOperacao: null, metaPorMaterial: null });
    expect(apagado.diasDeOperacao).toBeNull();
    expect(apagado.metaPorMaterial).toBeNull();
  });

  it("não altera o objeto original", () => {
    const copia = structuredClone(atual);
    mesclarConfiguracoes(atual, { metaRecuperacaoKg: 9999, notificacoes: { cadaRegistro: true } });
    expect(atual).toEqual(copia);
  });
});

describe("validarMeta", () => {
  it("aceita de 100 a 1.000.000 kg", () => {
    expect(validarMeta(100)).toBeNull();
    expect(validarMeta(1500)).toBeNull();
    expect(validarMeta(1_000_000)).toBeNull();
  });

  it("recusa fora do intervalo, com os limites na mensagem", () => {
    const erro = "A meta deve ficar entre 100 e 1.000.000 kg por mês.";
    expect(validarMeta(99)).toBe(erro);
    expect(validarMeta(1_000_001)).toBe(erro);
  });

  it("recusa o que não é número inteiro", () => {
    const erro = "Informe a meta em quilos, só com números.";
    expect(validarMeta(1500.5)).toBe(erro);
    expect(validarMeta(Number.NaN)).toBe(erro);
  });
});

describe("percentualDaMeta", () => {
  it("arredonda o percentual atingido", () => {
    expect(percentualDaMeta(150, 1000)).toBe(15);
    expect(percentualDaMeta(1, 3)).toBe(33);
  });

  it("não limita o texto em 100%", () => {
    expect(percentualDaMeta(1200, 1000)).toBe(120);
  });

  it("devolve zero sem meta, em vez de NaN ou infinito", () => {
    expect(percentualDaMeta(500, 0)).toBe(0);
    expect(percentualDaMeta(500, -10)).toBe(0);
  });
});

describe("lerQuilos", () => {
  it("lê com ou sem separador de milhar", () => {
    expect(lerQuilos("1.500")).toBe(1500);
    expect(lerQuilos("1500")).toBe(1500);
    expect(lerQuilos("12 kg")).toBe(12);
  });

  it("devolve NaN quando não há dígitos", () => {
    expect(lerQuilos("")).toBeNaN();
    expect(lerQuilos("abc")).toBeNaN();
  });
});
