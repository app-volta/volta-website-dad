import { describe, expect, it } from "vitest";

import {
  PESO_MAXIMO_KG,
  combinar,
  lerPeso,
  validarCnpj,
  validarDescricao,
  validarEmail,
  validarFoto,
  validarNome,
  validarObrigatorio,
  validarPeso,
  validarSenha,
} from "../../utils/validadores";

describe("validarEmail", () => {
  it("pede o e-mail quando vazio ou só espaços", () => {
    expect(validarEmail("")).toBe("Informe seu e-mail.");
    expect(validarEmail("   ")).toBe("Informe seu e-mail.");
  });

  it("recusa formato inválido", () => {
    expect(validarEmail("ana")).toBe("E-mail em formato inválido.");
    expect(validarEmail("ana@volta")).toBe("E-mail em formato inválido.");
    expect(validarEmail("ana @volta.com")).toBe("E-mail em formato inválido.");
  });

  it("recusa e-mail longo demais", () => {
    expect(validarEmail(`${"a".repeat(120)}@volta.com`)).toBe("E-mail muito longo.");
  });

  it("aceita e-mails comuns", () => {
    expect(validarEmail("ana.souza+painel@volta.com.br")).toBeNull();
    expect(validarEmail("ANA@VOLTA.COM")).toBeNull();
  });
});

describe("validarSenha (login)", () => {
  it("exige de 6 a 72 caracteres", () => {
    expect(validarSenha("")).toBe("Informe sua senha.");
    expect(validarSenha("12345")).toBe("Senha precisa de pelo menos 6 caracteres.");
    expect(validarSenha("123456")).toBeNull();
    expect(validarSenha("x".repeat(72))).toBeNull();
    expect(validarSenha("x".repeat(73))).toBe("Senha muito longa (máx. 72).");
  });
});

describe("validarObrigatorio", () => {
  it("pede o campo quando vazio, com o rótulo na mensagem", () => {
    expect(validarObrigatorio("  ", "o setor")).toBe("Preencha o setor.");
  });

  it("limita o tamanho depois de tirar os espaços das pontas", () => {
    expect(validarObrigatorio(` ${"a".repeat(10)} `, "o setor", 10)).toBeNull();
    expect(validarObrigatorio("a".repeat(11), "o setor", 10)).toBe(
      "o setor deve ter no máximo 10 caracteres.",
    );
  });
});

describe("validarNome", () => {
  it("exige de 3 a 80 caracteres", () => {
    expect(validarNome("")).toBe("Preencha o nome.");
    expect(validarNome("Al")).toBe("O nome precisa de pelo menos 3 letras.");
    expect(validarNome("Ana")).toBeNull();
    expect(validarNome("x".repeat(81))).toBe("o nome deve ter no máximo 80 caracteres.");
  });
});

describe("validarDescricao", () => {
  it("exige de 10 a 500 caracteres", () => {
    expect(validarDescricao("   ")).toBe("Descreva o resíduo encontrado.");
    expect(validarDescricao("curta")).toBe("Descrição muito curta (mín. 10 caracteres).");
    expect(validarDescricao("Caixas de papelão molhadas")).toBeNull();
    expect(validarDescricao("x".repeat(501))).toBe("Descrição longa demais (máx. 500).");
  });
});

describe("validarFoto", () => {
  it("pede a foto quando não há", () => {
    expect(validarFoto(null)).toBe("Adicione uma foto do resíduo.");
    expect(validarFoto("")).toBe("Adicione uma foto do resíduo.");
    expect(validarFoto("data:image/jpeg;base64,AAAA")).toBeNull();
  });
});

describe("peso", () => {
  it("lê com vírgula ou ponto como separador decimal", () => {
    expect(lerPeso("12,5")).toBe(12.5);
    expect(lerPeso("12.5")).toBe(12.5);
    expect(lerPeso(" 8 ")).toBe(8);
  });

  it("devolve NaN quando vazio ou inválido", () => {
    expect(lerPeso("")).toBeNaN();
    expect(lerPeso("abc")).toBeNaN();
  });

  it("é opcional: vazio vale", () => {
    expect(validarPeso("")).toBeNull();
    expect(validarPeso("   ")).toBeNull();
  });

  it("preenchido, precisa ser maior que 0 e ir até 100.000 kg", () => {
    const erro = "Informe um peso maior que 0 e até 100.000 kg, ou deixe em branco.";
    expect(validarPeso("2,5")).toBeNull();
    expect(validarPeso(String(PESO_MAXIMO_KG))).toBeNull();
    expect(validarPeso("0")).toBe(erro);
    expect(validarPeso("-3")).toBe(erro);
    expect(validarPeso(String(PESO_MAXIMO_KG + 1))).toBe(erro);
    expect(validarPeso("abc")).toBe(erro);
  });
});

describe("validarCnpj", () => {
  it("pede o CNPJ quando vazio", () => {
    expect(validarCnpj("")).toBe("Informe o CNPJ.");
  });

  it("exige 14 dígitos, com ou sem máscara", () => {
    expect(validarCnpj("123")).toBe("O CNPJ tem 14 dígitos.");
    expect(validarCnpj("11.222.333/0001-81")).toBeNull();
    expect(validarCnpj("11222333000181")).toBeNull();
  });

  it("recusa dígitos repetidos", () => {
    expect(validarCnpj("11111111111111")).toBe("CNPJ inválido.");
  });

  it("confere os dígitos verificadores", () => {
    expect(validarCnpj("11.222.333/0001-82")).toBe("CNPJ inválido. Confira os números.");
    expect(validarCnpj("11.222.333/0001-91")).toBe("CNPJ inválido. Confira os números.");
  });
});

describe("combinar", () => {
  it("junta só as mensagens preenchidas", () => {
    expect(combinar({ email: "E-mail inválido.", senha: null, nome: "" })).toEqual({
      valido: false,
      erros: { email: "E-mail inválido." },
    });
  });

  it("é válido quando nenhum campo tem erro", () => {
    expect(combinar({ email: null, senha: null })).toEqual({ valido: true, erros: {} });
    expect(combinar({})).toEqual({ valido: true, erros: {} });
  });
});
