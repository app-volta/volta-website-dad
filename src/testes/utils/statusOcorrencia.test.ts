import { describe, expect, it } from "vitest";

import type { StatusOcorrencia } from "../../types/ocorrencia";
import { aguardaAprovacao, categoriaDe } from "../../utils/statusOcorrencia";

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
