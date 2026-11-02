import { describe, expect, it } from "vitest";

import {
  DICA_DE_SENHA,
  SENHA_MAXIMA,
  avaliarSenha,
  validarConfirmacao,
  validarNovaSenha,
} from "./senha";

describe("avaliarSenha", () => {
  it.each([
    ["", 0, "fraca"],
    ["abc", 0, "fraca"],
    ["abc123", 1, "fraca"],
    ["abcdefg1", 2, "media"],
    ["Abcdefg1", 3, "media"],
    ["senhasecreta123", 3, "media"],
    ["Abcdefg1!", 4, "forte"],
    ["SenhaSecreta123", 4, "forte"],
  ])("%j tem %i ponto(s) e nível %s", (senha, pontos, nivel) => {
    const avaliacao = avaliarSenha(senha);
    expect(avaliacao.pontos).toBe(pontos);
    expect(avaliacao.nivel).toBe(nivel);
  });

  it("não passa de fraca quando é curta, por mais variada que seja", () => {
    expect(avaliarSenha("Ab1!")).toMatchObject({ pontos: 1, nivel: "fraca", rotulo: "Fraca" });
  });

  it("entende letras acentuadas como letras", () => {
    expect(avaliarSenha("Ação1234").nivel).toBe("media");
  });

  it("dá o rótulo em português", () => {
    expect(avaliarSenha("abcdefg1").rotulo).toBe("Média");
    expect(avaliarSenha("Abcdefg1!").rotulo).toBe("Forte");
  });
});

describe("validarNovaSenha", () => {
  it("pede a senha quando vazia", () => {
    expect(validarNovaSenha("")).toBe("Informe a nova senha.");
  });

  it("recusa senha curta, sem letra ou sem número com a dica", () => {
    expect(validarNovaSenha("abc12")).toBe(DICA_DE_SENHA);
    expect(validarNovaSenha("abcdefgh")).toBe(DICA_DE_SENHA);
    expect(validarNovaSenha("12345678")).toBe(DICA_DE_SENHA);
  });

  it("recusa senha acima de 72 caracteres", () => {
    expect(validarNovaSenha(`a1${"x".repeat(SENHA_MAXIMA)}`)).toBe(
      "A senha pode ter no máximo 72 caracteres.",
    );
  });

  it("aceita de 8 a 72 caracteres com letras e números", () => {
    expect(validarNovaSenha("abcdefg1")).toBeNull();
    expect(validarNovaSenha("açaí-1234")).toBeNull();
    expect(validarNovaSenha(`a1${"x".repeat(SENHA_MAXIMA - 2)}`)).toBeNull();
  });
});

describe("validarConfirmacao", () => {
  it("pede a confirmação quando vazia", () => {
    expect(validarConfirmacao("abcdefg1", "")).toBe("Confirme a nova senha.");
  });

  it("recusa senhas diferentes e aceita iguais", () => {
    expect(validarConfirmacao("abcdefg1", "abcdefg2")).toBe("As senhas não são iguais.");
    expect(validarConfirmacao("abcdefg1", "abcdefg1")).toBeNull();
  });
});
