import type { Cooperativa } from "../types/cooperativa";

export type EstadoLicenca =
  | "valida"
  | "vencendo"
  | "vencida"
  | "em_analise"
  | "sem_licenca";

/** A licença passa a "vencendo" quando faltam 30 dias ou menos. */
const LIMITE_VENCENDO_DIAS = 30;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const MESES: readonly string[] = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

type DadosLicenca = Pick<Cooperativa, "licencaValidaAte" | "licencaDocumento">;

function meiaNoite(data: Date): number {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime();
}

function lerData(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

/** Dias inteiros entre hoje e o fim da validade; negativo quando já venceu. */
export function diasParaVencer(iso: string, agora: Date = new Date()): number {
  return Math.round((meiaNoite(lerData(iso)) - meiaNoite(agora)) / MS_POR_DIA);
}

export function estadoLicenca(
  coop: DadosLicenca,
  agora: Date = new Date(),
): EstadoLicenca {
  if (coop.licencaValidaAte) {
    const dias = diasParaVencer(coop.licencaValidaAte, agora);
    if (dias < 0) return "vencida";
    return dias <= LIMITE_VENCENDO_DIAS ? "vencendo" : "valida";
  }
  return coop.licencaDocumento ? "em_analise" : "sem_licenca";
}

/** Mês e ano abreviados, como "dez/2027". */
export function formatarMesAno(iso: string): string {
  const data = lerData(iso);
  return `${MESES[data.getMonth()]}/${data.getFullYear()}`;
}

function textoVencendo(dias: number): string {
  if (dias === 0) return "Vence hoje";
  return dias === 1 ? "Vence em 1 dia" : `Vence em ${dias} dias`;
}

/**
 * Texto curto da licença para a tabela e o painel. A tabela diz "Até dez/2027"
 * e o painel "Válida até dez/2027"; os demais estados são iguais nos dois.
 */
export function rotuloLicenca(
  coop: DadosLicenca,
  agora: Date = new Date(),
  completo = false,
): string {
  const estado = estadoLicenca(coop, agora);
  const validade = coop.licencaValidaAte;
  switch (estado) {
    case "valida":
      return `${completo ? "Válida até" : "Até"} ${formatarMesAno(validade ?? "")}`;
    case "vencendo":
      return textoVencendo(diasParaVencer(validade ?? "", agora));
    case "vencida":
      return "Licença vencida";
    case "em_analise":
      return "Docs em análise";
    case "sem_licenca":
      return "Sem licença";
  }
}

export interface ResumoCooperativas {
  readonly ativas: number;
  readonly emHomologacao: number;
  readonly destinadoTrimestreKg: number;
  readonly licencasVencendo: number;
}

export function resumirCooperativas(
  lista: readonly Cooperativa[],
  agora: Date = new Date(),
): ResumoCooperativas {
  let destinado = 0;
  let vencendo = 0;
  for (const coop of lista) {
    destinado += coop.volumeMensalKg.slice(-3).reduce((s, kg) => s + kg, 0);
    const estado = estadoLicenca(coop, agora);
    if (estado === "vencendo" || estado === "vencida") vencendo += 1;
  }
  return {
    ativas: lista.filter((c) => c.situacao === "ativa").length,
    emHomologacao: lista.filter((c) => c.situacao === "em_homologacao").length,
    destinadoTrimestreKg: destinado,
    licencasVencendo: vencendo,
  };
}

/** Rótulos dos cinco meses do gráfico, terminando no último mês fechado. */
export function mesesDoGrafico(agora: Date = new Date()): readonly string[] {
  return Array.from({ length: 5 }, (_, i) => {
    const mes = (agora.getMonth() - 5 + i + 12) % 12;
    return MESES[mes];
  });
}

export const TAMANHO_MAXIMO_LICENCA_BYTES = 10 * 1024 * 1024;

/** A licença é opcional no envio, mas, quando vem, precisa ser um PDF até 10 MB. */
export function validarLicenca(arquivo: File | null): string | null {
  if (!arquivo) return null;
  const ehPdf =
    arquivo.type === "application/pdf" ||
    arquivo.name.toLowerCase().endsWith(".pdf");
  if (!ehPdf) return "Envie a licença em PDF.";
  if (arquivo.size > TAMANHO_MAXIMO_LICENCA_BYTES) {
    return "O PDF passa de 10 MB.";
  }
  return null;
}

export function cooperativasNoRaio(
  lista: readonly Cooperativa[],
  raioKm = 10,
): number {
  return lista.filter((c) => c.distanciaKm <= raioKm).length;
}
