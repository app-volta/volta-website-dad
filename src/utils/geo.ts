export interface Coordenadas {
  readonly latitude: number;
  readonly longitude: number;
}

const RAIO_DA_TERRA_KM = 6371;

function emRadianos(graus: number): number {
  return (graus * Math.PI) / 180;
}

/** Distância em linha reta entre dois pontos (fórmula de haversine), com uma casa decimal. */
export function distanciaEmKm(origem: Coordenadas, destino: Coordenadas): number {
  const dLat = emRadianos(destino.latitude - origem.latitude);
  const dLon = emRadianos(destino.longitude - origem.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(emRadianos(origem.latitude)) *
      Math.cos(emRadianos(destino.latitude)) *
      Math.sin(dLon / 2) ** 2;
  const km = 2 * RAIO_DA_TERRA_KM * Math.asin(Math.sqrt(a));
  return Math.round(km * 10) / 10;
}

/**
 * Ponto a `distanciaKm` de `origem`, na direção `rumoGraus` (0 é norte, 90 é leste).
 * Aproximação plana, boa para algumas dezenas de quilômetros.
 */
export function pontoA(
  origem: Coordenadas,
  distanciaKm: number,
  rumoGraus: number,
): Coordenadas {
  const rumo = emRadianos(rumoGraus);
  const kmPorGrau = (Math.PI * RAIO_DA_TERRA_KM) / 180;
  return {
    latitude: Number((origem.latitude + (distanciaKm * Math.cos(rumo)) / kmPorGrau).toFixed(6)),
    longitude: Number(
      (
        origem.longitude +
        (distanciaKm * Math.sin(rumo)) / (kmPorGrau * Math.cos(emRadianos(origem.latitude)))
      ).toFixed(6),
    ),
  };
}

interface ComDistancia {
  readonly nome: string;
  readonly distanciaKm: number | null;
}

/** Da mais próxima para a mais distante; sem distância, no fim e em ordem alfabética. */
export function maisProximasPrimeiro<T extends ComDistancia>(lista: readonly T[]): readonly T[] {
  return [...lista].sort((a, b) => {
    if (a.distanciaKm === null && b.distanciaKm === null) return a.nome.localeCompare(b.nome, "pt-BR");
    if (a.distanciaKm === null) return 1;
    if (b.distanciaKm === null) return -1;
    return a.distanciaKm - b.distanciaKm || a.nome.localeCompare(b.nome, "pt-BR");
  });
}
