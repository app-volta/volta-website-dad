import { describe, expect, it } from "vitest";

import {
  foiConflito,
  foiNaoAutorizado,
  foiOcorrenciaDesatualizada,
  foiProibido,
  foiResultadoIncerto,
  foiSemResposta,
  mensagemDoCampo,
} from "../../utils/erros";

const comStatus = (status: unknown): { status: unknown } => ({ status });

describe("classificação de erros pelo status HTTP", () => {
  it("reconhece 401 como credenciais recusadas", () => {
    expect(foiNaoAutorizado(comStatus(401))).toBe(true);
    expect(foiNaoAutorizado(comStatus(403))).toBe(false);
  });

  it("reconhece 403 como acesso restrito", () => {
    expect(foiProibido(comStatus(403))).toBe(true);
    expect(foiProibido(comStatus(401))).toBe(false);
  });

  it("reconhece 409 como conflito", () => {
    expect(foiConflito(comStatus(409))).toBe(true);
    expect(foiConflito(comStatus(422))).toBe(false);
  });

  it("trata status 0 e 5xx como serviço sem resposta, e 4xx como erro de regra", () => {
    expect(foiSemResposta(comStatus(0))).toBe(true);
    expect(foiSemResposta(comStatus(500))).toBe(true);
    expect(foiSemResposta(comStatus(503))).toBe(true);
    expect(foiSemResposta(comStatus(499))).toBe(false);
    expect(foiSemResposta(comStatus(422))).toBe(false);
  });

  it("só o status 0 deixa o resultado incerto (a API pode ter recebido o pedido)", () => {
    expect(foiResultadoIncerto(comStatus(0))).toBe(true);
    expect(foiResultadoIncerto(comStatus(500))).toBe(false);
  });

  it("não se confunde com valores que não são erros da API", () => {
    for (const valor of [null, undefined, "401", 401, new Error("falhou"), {}, comStatus("401")]) {
      expect(foiNaoAutorizado(valor)).toBe(false);
      expect(foiSemResposta(valor)).toBe(false);
      expect(foiProibido(valor)).toBe(false);
    }
  });
});

describe("foiOcorrenciaDesatualizada", () => {
  it("vale só com o marcador verdadeiro", () => {
    expect(foiOcorrenciaDesatualizada({ desatualizada: true })).toBe(true);
    expect(foiOcorrenciaDesatualizada({ desatualizada: false })).toBe(false);
    expect(foiOcorrenciaDesatualizada(new Error("x"))).toBe(false);
    expect(foiOcorrenciaDesatualizada(null)).toBe(false);
  });
});

describe("mensagemDoCampo", () => {
  it("devolve a mensagem que a API ligou ao campo", () => {
    const erro = { campos: { senhaAtual: "Senha atual incorreta." } };
    expect(mensagemDoCampo(erro, "senhaAtual")).toBe("Senha atual incorreta.");
  });

  it("devolve nulo para outro campo ou quando o erro não é de campo", () => {
    const erro = { campos: { senhaAtual: "Senha atual incorreta." } };
    expect(mensagemDoCampo(erro, "novaSenha")).toBeNull();
    expect(mensagemDoCampo(new Error("x"), "senhaAtual")).toBeNull();
    expect(mensagemDoCampo(null, "senhaAtual")).toBeNull();
    expect(mensagemDoCampo({ campos: null }, "senhaAtual")).toBeNull();
    expect(mensagemDoCampo({ campos: "texto" }, "senhaAtual")).toBeNull();
  });

  it("ignora um valor que não é texto", () => {
    expect(mensagemDoCampo({ campos: { senhaAtual: 42 } }, "senhaAtual")).toBeNull();
  });
});
