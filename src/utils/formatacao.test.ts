import { describe, expect, it } from "vitest";

import {
  descreverPeso,
  formatarDataHora,
  formatarDistanciaKm,
  formatarKg,
  formatarKm,
  formatarKmOpcional,
  formatarNota,
  formatarNotaDaCooperativa,
  formatarPeso,
  formatarRegistro,
  mascararCnpj,
} from "./formatacao";

const ESPACO_FIXO = " ";

describe("distâncias", () => {
  it("mostra em metros abaixo de 1 km", () => {
    expect(formatarDistanciaKm(0.5)).toBe("500 m");
    expect(formatarDistanciaKm(2.34)).toBe("2.3 km");
  });

  it("usa vírgula decimal e uma casa", () => {
    expect(formatarKm(2.4)).toBe("2,4 km");
    expect(formatarKm(10)).toBe("10,0 km");
  });

  it("mostra traço quando a fonte não informa a distância", () => {
    expect(formatarKmOpcional(null)).toBe("—");
    expect(formatarKmOpcional(2.4)).toBe("2,4 km");
  });
});

describe("pesos", () => {
  it("mostra traço enquanto ninguém informou", () => {
    expect(formatarPeso(0)).toBe("—");
    expect(formatarPeso(-1)).toBe("—");
    expect(descreverPeso(0)).toBe("Não informado");
  });

  it("usa espaço sem quebra e separador de milhar", () => {
    expect(formatarPeso(12)).toBe(`≈${ESPACO_FIXO}12${ESPACO_FIXO}kg`);
    expect(formatarPeso(1234.567)).toBe(`≈${ESPACO_FIXO}1.234,57${ESPACO_FIXO}kg`);
  });

  it("na versão compacta não há espaço depois do ≈", () => {
    expect(formatarPeso(12.5, true)).toBe(`≈12,5${ESPACO_FIXO}kg`);
  });

  it("arredonda para quilos inteiros com milhar", () => {
    expect(formatarKg(1820)).toBe("1.820 kg");
    expect(formatarKg(1234.6)).toBe("1.235 kg");
    expect(formatarKg(0.4)).toBe("0 kg");
  });
});

describe("notas", () => {
  it("a nota da API de ranking só tem casa decimal quando precisa", () => {
    expect(formatarNotaDaCooperativa(87)).toBe("87");
    expect(formatarNotaDaCooperativa(87.46)).toBe("87,5");
  });

  it("a nota da cooperativa sempre tem uma casa", () => {
    expect(formatarNota(4.9)).toBe("4,9");
    expect(formatarNota(5)).toBe("5,0");
  });
});

describe("mascararCnpj", () => {
  it("aplica a máscara completa", () => {
    expect(mascararCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("monta a máscara enquanto a pessoa digita", () => {
    expect(mascararCnpj("")).toBe("");
    expect(mascararCnpj("11")).toBe("11");
    expect(mascararCnpj("1122")).toBe("11.22");
    expect(mascararCnpj("11222333")).toBe("11.222.333");
    expect(mascararCnpj("112223330001")).toBe("11.222.333/0001");
  });

  it("ignora o que não é dígito e o que passa de 14", () => {
    expect(mascararCnpj("11.222.333/0001-81")).toBe("11.222.333/0001-81");
    expect(mascararCnpj("112223330001819999")).toBe("11.222.333/0001-81");
  });
});

describe("datas", () => {
  const agora = new Date(2026, 10, 18, 15);

  it("formatarRegistro diz hoje, ontem ou há quantos dias", () => {
    expect(formatarRegistro(new Date(2026, 10, 18, 9, 30).toISOString(), agora)).toBe("hoje, 09:30");
    expect(formatarRegistro(new Date(2026, 10, 17, 23, 5).toISOString(), agora)).toBe("ontem, 23:05");
    expect(formatarRegistro(new Date(2026, 10, 15, 8).toISOString(), agora)).toBe("3 dias");
  });

  it("formatarDataHora mostra dia, mês, ano e hora", () => {
    const texto = formatarDataHora(new Date(2026, 10, 18, 9, 30).toISOString());
    expect(texto).toContain("18/11/2026");
    expect(texto).toContain("09:30");
  });
});
