import { describe, expect, it } from "vitest";

import { criarOcorrencia } from "../fabricas";
import { contarSemelhantesNaSemana } from "../../utils/ocorrencias";

/** Quarta-feira, 18/11/2026, às 15h. */
const AGORA = new Date(2026, 10, 18, 15).getTime();
const em = (dia: number, hora = 9): string => new Date(2026, 10, dia, hora).toISOString();

function ocorrencia(id: string, parcial: Parameters<typeof criarOcorrencia>[0] = {}) {
  return criarOcorrencia({
    id,
    titulo: "Papelão molhado",
    localizacao: { setor: "Expedição", unidade: "Lins" },
    criadaEm: em(17),
    ...parcial,
  });
}

describe("contarSemelhantesNaSemana", () => {
  const atual = ocorrencia("atual", { criadaEm: em(17) });

  it("conta as do mesmo título e setor na última semana, incluindo a própria", () => {
    const lista = [ocorrencia("a", { criadaEm: em(12) }), ocorrencia("b", { criadaEm: em(15) }), atual];
    expect(contarSemelhantesNaSemana(lista, atual, AGORA)).toBe(3);
  });

  it("não conta outro título nem outro setor", () => {
    const lista = [
      ocorrencia("a", { titulo: "Vidro" }),
      ocorrencia("b", { localizacao: { setor: "Refeitório", unidade: "Lins" } }),
      atual,
    ];
    expect(contarSemelhantesNaSemana(lista, atual, AGORA)).toBe(1);
  });

  it("não conta as de mais de sete dias atrás", () => {
    const lista = [ocorrencia("velha", { criadaEm: em(10) }), ocorrencia("limite", { criadaEm: em(11, 15) }), atual];
    expect(contarSemelhantesNaSemana(lista, atual, AGORA)).toBe(2);
  });

  it("não conta as registradas depois da ocorrência", () => {
    const lista = [ocorrencia("depois", { criadaEm: em(18) }), atual];
    expect(contarSemelhantesNaSemana(lista, atual, AGORA)).toBe(1);
  });

  it("sem a própria ocorrência na lista, não há o que contar", () => {
    expect(contarSemelhantesNaSemana([], atual, AGORA)).toBe(0);
  });
});
