import type {
  Configuracoes,
  DiasDeOperacao,
  MetaDoDia,
  MetaPorMaterial,
} from "../types/configuracao";
import { MATERIAIS } from "../types/material";
import type { Material } from "../types/material";
import type { Ocorrencia } from "../types/ocorrencia";
import { aprovada, calcularPainel, somaKg } from "./painel";

export const DIAS_MINIMOS = 1;
export const DIAS_MAXIMOS = 31;

/** Chave AAAA-MM do mês de `data`, no horário local. */
export function chaveDoMes(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

/** Chave AAAA-MM-DD do dia de `data`, no horário local. */
export function chaveDoDia(data: Date): string {
  return `${chaveDoMes(data)}-${String(data.getDate()).padStart(2, "0")}`;
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

// ---------- meta por material

/** Soma das metas dos materiais; um campo em branco (NaN) não conta. */
export function somaDasMetas(metas: Readonly<Record<Material, number>>): number {
  return MATERIAIS.reduce(
    (soma, material) => soma + (Number.isNaN(metas[material]) ? 0 : metas[material]),
    0,
  );
}

/**
 * Parte de cada material no total (de 0 a 1, somando 1). Sem base, ou com
 * tudo zerado, os quatro dividem igualmente.
 */
export function partesDasMetas(
  base: Readonly<Partial<Record<Material, number>>>,
): Record<Material, number> {
  const pesos = MATERIAIS.map((material) => Math.max(0, base[material] ?? 0));
  const total = pesos.reduce((soma, peso) => soma + peso, 0);
  return Object.fromEntries(
    MATERIAIS.map((material, indice) => [
      material,
      total > 0 ? pesos[indice] / total : 1 / MATERIAIS.length,
    ]),
  ) as Record<Material, number>;
}

/** Divide a meta do mês entre os materiais pelas partes; a soma fecha exatamente a meta. */
export function distribuirMeta(
  metaMensalKg: number,
  partes: Readonly<Record<Material, number>>,
): Record<Material, number> {
  const metas = Object.fromEntries(
    MATERIAIS.map((material) => [material, Math.floor(metaMensalKg * partes[material])]),
  ) as Record<Material, number>;
  let resto = metaMensalKg - somaDasMetas(metas);
  // O arredondamento deixa poucos quilos sobrando: vão um a um para os maiores.
  const ordem = [...MATERIAIS].sort((a, b) => partes[b] - partes[a]);
  for (let indice = 0; resto > 0; indice = (indice + 1) % ordem.length) {
    metas[ordem[indice]] += 1;
    resto -= 1;
  }
  return metas;
}

/**
 * Ponto de partida da meta por material no formulário: a divisão já salva (se ainda
 * fecha a meta do mês) ou a meta do mês repartida pelas mesmas partes. Sem divisão
 * salva, as partes seguem o que cada material já recuperou.
 */
export function divisaoInicial(
  metaMensalKg: number,
  salva: MetaPorMaterial | null,
  recuperadoKg: Readonly<Record<Material, number>>,
): { readonly partes: Record<Material, number>; readonly valores: Record<Material, number> | null } {
  const partes = partesDasMetas(salva ?? recuperadoKg);
  if (metaMensalKg <= 0) return { partes, valores: null };
  if (salva !== null && somaDasMetas(salva) === metaMensalKg) {
    return { partes, valores: { ...salva } };
  }
  return { partes, valores: distribuirMeta(metaMensalKg, partes) };
}

function kgNoTexto(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

/** "A soma dá 1.600 kg, 100 kg acima da meta do mês (1.500 kg)." */
export function mensagemDaSomaDiferente(somaKgDosMateriais: number, metaMensalKg: number): string {
  const diferenca = Math.abs(somaKgDosMateriais - metaMensalKg);
  const sentido = somaKgDosMateriais > metaMensalKg ? "acima" : "abaixo";
  return `A soma dá ${kgNoTexto(somaKgDosMateriais)} kg, ${kgNoTexto(diferenca)} kg ${sentido} da meta do mês (${kgNoTexto(metaMensalKg)} kg).`;
}

// ---------- avisos da meta

/** Dias de segunda a sábado já passados no mês, sem contar hoje. */
function diasPassadosDoMes(agora: Date): number {
  let passados = 0;
  for (let dia = 1; dia < agora.getDate(); dia += 1) {
    if (new Date(agora.getFullYear(), agora.getMonth(), dia).getDay() !== 0) passados += 1;
  }
  return passados;
}

export interface AvisosCalculados {
  /** Preenchido quando a meta de hoje foi batida e o aviso está ligado. */
  readonly metaDoDiaBatida: { readonly hojeKg: number; readonly metaDoDiaKg: number } | null;
  /** Preenchido quando o mês está atrás do ritmo e o aviso está ligado. */
  readonly foraDoRitmo: { readonly atingidoPct: number; readonly esperadoPct: number } | null;
}

/** Quanto atrás do ritmo o mês precisa estar (em pontos de porcentagem) para gerar o alerta. */
const FOLGA_DO_RITMO = 0.1;
/** O alerta só vale depois de uns dias de operação: no começo do mês o ritmo ainda não diz nada. */
const RITMO_MINIMO_ESPERADO = 0.2;

/** Os avisos da meta que valem agora, com as preferências da pessoa. */
export function avisosDaMeta(
  ocorrencias: readonly Ocorrencia[],
  metaMensalKg: number,
  preferencias: Pick<Configuracoes, "metaDoDia" | "diasDeOperacao" | "avisosDaMeta">,
  agora: Date = new Date(),
): AvisosCalculados {
  if (metaMensalKg <= 0) return { metaDoDiaBatida: null, foraDoRitmo: null };

  const diasDoMes = diasDeOperacaoDoMes(preferencias.diasDeOperacao, agora);
  const metaDeHoje = metaDoDiaKg(metaMensalKg, diasDoMes, preferencias.metaDoDia);
  const hojeKg = recuperadoHojeKg(ocorrencias, agora);
  const metaDoDiaBatida =
    preferencias.avisosDaMeta.avisarMetaDoDia && metaDeHoje > 0 && hojeKg >= metaDeHoje
      ? { hojeKg, metaDoDiaKg: metaDeHoje }
      : null;

  let foraDoRitmo: AvisosCalculados["foraDoRitmo"] = null;
  if (preferencias.avisosDaMeta.alertarRitmo) {
    const total = diasDeOperacaoPadrao(agora);
    const esperado = total > 0 ? diasPassadosDoMes(agora) / total : 0;
    const atingido = calcularPainel(ocorrencias, metaMensalKg, agora).recuperadoMesKg / metaMensalKg;
    if (esperado >= RITMO_MINIMO_ESPERADO && atingido < esperado - FOLGA_DO_RITMO) {
      foraDoRitmo = {
        atingidoPct: Math.round(atingido * 100),
        esperadoPct: Math.round(esperado * 100),
      };
    }
  }
  return { metaDoDiaBatida, foraDoRitmo };
}
