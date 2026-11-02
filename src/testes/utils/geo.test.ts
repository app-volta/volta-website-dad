import { describe, expect, it } from "vitest";

import { distanciaEmKm, maisProximasPrimeiro, pontoA } from "../../utils/geo";

const LINS = { latitude: -21.6786, longitude: -49.7425 };
const SAO_PAULO = { latitude: -23.5505, longitude: -46.6333 };
const RIO = { latitude: -22.9068, longitude: -43.1729 };

describe("distanciaEmKm", () => {
  it("é zero entre o mesmo ponto", () => {
    expect(distanciaEmKm(LINS, LINS)).toBe(0);
  });

  it("dá a distância em linha reta entre duas cidades (São Paulo e Rio ficam a uns 360 km)", () => {
    const km = distanciaEmKm(SAO_PAULO, RIO);
    expect(km).toBeGreaterThan(350);
    expect(km).toBeLessThan(365);
  });

  it("é a mesma nos dois sentidos", () => {
    expect(distanciaEmKm(SAO_PAULO, RIO)).toBe(distanciaEmKm(RIO, SAO_PAULO));
  });

  it("arredonda para uma casa decimal", () => {
    const km = distanciaEmKm(LINS, SAO_PAULO);
    expect(km).toBe(Math.round(km * 10) / 10);
  });
});

describe("pontoA", () => {
  it.each([
    ["norte", 0],
    ["leste", 90],
    ["sul", 180],
    ["oeste", 270],
  ])("um ponto a 10 km para o %s fica a 10 km de volta", (_, rumo) => {
    const ponto = pontoA(LINS, 10, rumo);
    expect(Math.abs(distanciaEmKm(LINS, ponto) - 10)).toBeLessThan(0.1);
  });

  it("anda na direção do rumo", () => {
    expect(pontoA(LINS, 10, 0).latitude).toBeGreaterThan(LINS.latitude);
    expect(pontoA(LINS, 10, 180).latitude).toBeLessThan(LINS.latitude);
    expect(pontoA(LINS, 10, 90).longitude).toBeGreaterThan(LINS.longitude);
    expect(pontoA(LINS, 10, 270).longitude).toBeLessThan(LINS.longitude);
  });

  it("com distância zero devolve a própria origem", () => {
    expect(pontoA(LINS, 0, 45)).toEqual(LINS);
  });
});

describe("maisProximasPrimeiro", () => {
  const lista = [
    { nome: "Beta", distanciaKm: 5 },
    { nome: "Zeta", distanciaKm: null },
    { nome: "Alfa", distanciaKm: 2 },
    { nome: "Gama", distanciaKm: null },
    { nome: "Ágata", distanciaKm: 5 },
  ];

  it("ordena da mais próxima para a mais distante, sem distância no fim em ordem alfabética", () => {
    expect(maisProximasPrimeiro(lista).map((item) => item.nome)).toEqual([
      "Alfa",
      "Ágata",
      "Beta",
      "Gama",
      "Zeta",
    ]);
  });

  it("desempata pelo nome respeitando acentos", () => {
    const resultado = maisProximasPrimeiro(lista).filter((item) => item.distanciaKm === 5);
    expect(resultado.map((item) => item.nome)).toEqual(["Ágata", "Beta"]);
  });

  it("não altera a lista original", () => {
    const copia = [...lista];
    maisProximasPrimeiro(lista);
    expect(lista).toEqual(copia);
  });
});
