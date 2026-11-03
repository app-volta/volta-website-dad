import { describe, expect, it } from "vitest";

import { TAMANHO_MAXIMO_FOTO, arquivoDaFoto, fotoAceita } from "../../utils/arquivo";

describe("fotoAceita", () => {
  it("aceita imagem até o limite, inclusive no limite", () => {
    expect(fotoAceita({ type: "image/png", size: 1024 })).toBe(true);
    expect(fotoAceita({ type: "image/jpeg", size: TAMANHO_MAXIMO_FOTO })).toBe(true);
  });

  it("recusa o que passa do limite de 10 MB", () => {
    expect(fotoAceita({ type: "image/png", size: TAMANHO_MAXIMO_FOTO + 1 })).toBe(false);
  });

  it("recusa o que não é imagem", () => {
    expect(fotoAceita({ type: "application/pdf", size: 1024 })).toBe(false);
    expect(fotoAceita({ type: "", size: 1024 })).toBe(false);
  });
});

describe("arquivoDaFoto", () => {
  it("converte o data URL em arquivo com o tipo e a extensão da imagem", () => {
    const arquivo = arquivoDaFoto("data:image/png;base64,iVBORw0KGgo=", "residuo");
    expect(arquivo.type).toBe("image/png");
    expect(arquivo.name).toBe("residuo.png");
    expect(arquivo.size).toBeGreaterThan(0);
  });

  it("sem cabeçalho de tipo, cai em jpeg", () => {
    expect(arquivoDaFoto(",QUJD").type).toBe("image/jpeg");
  });
});
