export function formatarDataHora(iso: string): string {
  try {
    const data = new Date(iso);
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatarDistanciaKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatarPorcentagem(razao: number): string {
  return `${Math.round(razao * 100)}%`;
}
