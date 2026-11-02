import { describe, expect, it } from "vitest";

import { criarOcorrencia } from "../fabricas";
import type { StatusOcorrencia } from "../../types/ocorrencia";
import { aguardaAprovacao, categoriaDe, descreverRevisao } from "../../utils/statusOcorrencia";

describe("categoriaDe", () => {
  it.each<[StatusOcorrencia, string]>([
    ["aguardando_classificacao", "aguardando"],
    ["classificada", "aguardando"],
    ["aprovada", "aprovadas"],
    ["finalizada", "aprovadas"],
    ["encaminhada", "encaminhadas"],
    ["recusada", "recusadas"],
  ])("%s é da categoria %s", (status, categoria) => {
    expect(categoriaDe(status)).toBe(categoria);
  });
});

describe("aguardaAprovacao", () => {
  it("vale só para o que ainda não foi decidido", () => {
    expect(aguardaAprovacao("classificada")).toBe(true);
    expect(aguardaAprovacao("aguardando_classificacao")).toBe(true);
    expect(aguardaAprovacao("aprovada")).toBe(false);
    expect(aguardaAprovacao("recusada")).toBe(false);
    expect(aguardaAprovacao("encaminhada")).toBe(false);
    expect(aguardaAprovacao("finalizada")).toBe(false);
  });
});

describe("descreverRevisao", () => {
  const decidida = {
    status: "aprovada" as const,
    revisadaPor: "gestor-1",
    revisadaPorNome: "Carlos Lima",
    revisadaEm: new Date(2026, 10, 18, 14, 30).toISOString(),
  };

  it("cita quem aprovou e quando", () => {
    expect(descreverRevisao(criarOcorrencia(decidida), "outra-pessoa")).toBe("Aprovada por Carlos Lima em 18/11/2026, 14:30");
  });

  it("para a pessoa logada, diz \"por você\"", () => {
    expect(descreverRevisao(criarOcorrencia(decidida), "gestor-1")).toBe("Aprovada por você em 18/11/2026, 14:30");
  });

  it("recusada e encerrada seguem a decisão: a primeira é recusa, a segunda é aprovação", () => {
    expect(descreverRevisao(criarOcorrencia({ ...decidida, status: "recusada" }), undefined)).toMatch(/^Recusada por Carlos Lima em /);
    expect(descreverRevisao(criarOcorrencia({ ...decidida, status: "finalizada" }), undefined)).toMatch(/^Aprovada por Carlos Lima em /);
  });

  it("sem o nome de quem decidiu, cita só a data", () => {
    expect(descreverRevisao(criarOcorrencia({ ...decidida, revisadaPorNome: null }), "outra-pessoa")).toBe("Aprovada em 18/11/2026, 14:30");
  });

  it("sem a data da decisão, não diz nada", () => {
    expect(descreverRevisao(criarOcorrencia({ ...decidida, revisadaEm: null }), "gestor-1")).toBeNull();
  });

  it("encaminhada e a que ainda aguarda não têm revisão para mostrar", () => {
    expect(descreverRevisao(criarOcorrencia({ ...decidida, status: "encaminhada" }), "gestor-1")).toBeNull();
    expect(descreverRevisao(criarOcorrencia({ ...decidida, status: "classificada" }), "gestor-1")).toBeNull();
  });
});
