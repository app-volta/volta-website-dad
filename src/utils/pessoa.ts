/** Iniciais de duas letras: "Ana Souza" vira "AS". */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return `${primeira}${ultima}`.toUpperCase();
}

const ROTULO_DO_PAPEL = {
  responsavel_pgrs: "Gestor · Responsável PGRS",
  operador: "Operador",
} as const;

/** Papel como aparece no Meu perfil e nas Configurações. */
export function rotuloDoPapel(papel: keyof typeof ROTULO_DO_PAPEL): string {
  return ROTULO_DO_PAPEL[papel];
}
