/** O backend serializa LocalDateTime em UTC e sem fuso. */
export function instanteUtc(valor: string): string {
  const temFuso = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(valor);
  const data = new Date(temFuso ? valor : `${valor}Z`);
  return Number.isNaN(data.getTime()) ? valor : data.toISOString();
}
