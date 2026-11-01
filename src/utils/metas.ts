import type { DiasDeOperacao, MetaDoDia } from "../types/configuracao";
import type { Ocorrencia } from "../types/ocorrencia";
import { aprovada, somaKg } from "./painel";

export const DIAS_MINIMOS = 1;
export const DIAS_MAXIMOS = 31;

/** Chave AAAA-MM do mês de `data`, no horário local. */
export function chaveDoMes(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

/** "novembro de 2026". */
export function nomeDoMes(data: Date): string {
  return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/** Dias de segunda a sábado do mês de `data`: a operação normal de uma unidade industrial. */
export function diasDeOperacaoPadrao(data: Date): number {
  const total = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
  let dias = 0;
  for (let dia = 1; dia <= total; dia += 1) {
    if (new Date(data.getFullYear(), data.getMonth(), dia).getDay() !== 0) dias += 1;
  }
  return dias;
}

/** O que a pessoa definiu para este mês; sem isso (ou de outro mês), o padrão. */
export function diasDeOperacaoDoMes(
  salvo: DiasDeOperacao | null,
  data: Date,
): number {
  return salvo !== null && salvo.mes === chaveDoMes(data)
    ? salvo.dias
    : diasDeOperacaoPadrao(data);
}

/** Meta de cada dia de operação, em kg: a do mês dividida pelos dias, ou o valor fixo escolhido. */
export function metaDoDiaKg(
  metaMensalKg: number,
  dias: number,
  plano: MetaDoDia,
): number {
  if (plano.modo === "fixo") return plano.valorFixoKg;
  return dias > 0 ? Math.round(metaMensalKg / dias) : 0;
}

export function validarDias(valor: number): string | null {
  if (!Number.isInteger(valor) || valor < DIAS_MINIMOS || valor > DIAS_MAXIMOS) {
    return `Informe de ${DIAS_MINIMOS} a ${DIAS_MAXIMOS} dias.`;
  }
  return null;
}

export function validarValorFixoDoDia(
  valor: number,
  metaMensalKg: number,
): string | null {
  if (!Number.isInteger(valor) || valor < 1) {
    return "Informe quantos quilos por dia, só com números.";
  }
  if (Number.isFinite(metaMensalKg) && valor > metaMensalKg) {
    return "A meta do dia não pode passar da meta do mês.";
  }
  return null;
}

/** Quanto já foi recuperado hoje: ocorrências aprovadas registradas desde a meia-noite. */
export function recuperadoHojeKg(
  ocorrencias: readonly Ocorrencia[],
  agora: Date = new Date(),
): number {
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 1);
  return somaKg(
    ocorrencias.filter((ocorrencia) => {
      const instante = new Date(ocorrencia.criadaEm).getTime();
      return aprovada(ocorrencia) && instante >= inicio.getTime() && instante < fim.getTime();
    }),
  );
}
