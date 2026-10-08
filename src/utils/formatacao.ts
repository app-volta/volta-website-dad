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

/** Distância com vírgula decimal, como no layout: "2,4 km". */
export function formatarKm(km: number): string {
  return `${km.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

/** Peso com separador de milhar: "1.820 kg". */
export function formatarKg(kg: number): string {
  return `${Math.round(kg).toLocaleString("pt-BR")} kg`;
}

/** Aplica a máscara 00.000.000/0000-00 enquanto a pessoa digita. */
export function mascararCnpj(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 14);
  const partes = [
    d.slice(0, 2),
    d.slice(2, 5),
    d.slice(5, 8),
    d.slice(8, 12),
    d.slice(12, 14),
  ];
  let saida = partes[0];
  if (partes[1]) saida += `.${partes[1]}`;
  if (partes[2]) saida += `.${partes[2]}`;
  if (partes[3]) saida += `/${partes[3]}`;
  if (partes[4]) saida += `-${partes[4]}`;
  return saida;
}

export function formatarRegistro(iso: string, agora: Date = new Date()): string {
  const data = new Date(iso);
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const inicioDia = (d: Date): number =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((inicioDia(agora) - inicioDia(data)) / 86_400_000);
  if (dias <= 0) return `hoje, ${hora}`;
  if (dias === 1) return `ontem, ${hora}`;
  return `${dias} dias`;
}
