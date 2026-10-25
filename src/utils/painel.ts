import { MATERIAIS } from "../types/material";
import type { Material } from "../types/material";
import type { Ocorrencia } from "../types/ocorrencia";
import type {
  AtividadeEquipe,
  PainelInicio,
  PontoRecuperacao,
} from "../types/painel";

const DIA_MS = 86_400_000;
const SEMANAS_NO_PAINEL = 8;
const SEMANAS_NA_TENDENCIA = 7;
const MESES_NO_TRIMESTRE = 3;
const LIMITE_ATIVIDADES = 4;

/** Quanto tempo atrás: "há 5 min", "3h hoje", "ontem", "4 dias". */
export function tempoRelativo(iso: string, agora: number = Date.now()): string {
  const minutos = Math.round((agora - new Date(iso).getTime()) / 60_000);
  if (minutos < 60) return `há ${Math.max(minutos, 1)} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `${horas}h hoje`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return "ontem";
  return `${dias} dias`;
}

export function aprovada(o: Ocorrencia): boolean {
  return o.status === "aprovada" || o.status === "finalizada";
}

function aguardando(o: Ocorrencia): boolean {
  return o.status === "classificada" || o.status === "aguardando_classificacao";
}

export function somaKg(lista: readonly Ocorrencia[]): number {
  return lista.reduce((total, o) => total + o.pesoKg, 0);
}

/** Aprovadas entre as que já foram decididas (as encaminhadas ficam de fora). */
export function taxaDeAprovacao(lista: readonly Ocorrencia[]): number | null {
  const aprovadas = lista.filter(aprovada).length;
  const recusadas = lista.filter((o) => o.status === "recusada").length;
  const decididas = aprovadas + recusadas;
  return decididas === 0 ? null : Math.round((aprovadas / decididas) * 100);
}

export function entre(
  lista: readonly Ocorrencia[],
  de: number,
  ate: number,
): readonly Ocorrencia[] {
  return lista.filter((o) => {
    const instante = new Date(o.criadaEm).getTime();
    return instante >= de && instante < ate;
  });
}

export function inicioDoMes(agora: Date, deslocamento: number): number {
  return new Date(agora.getFullYear(), agora.getMonth() + deslocamento, 1).getTime();
}

function rotuloDoMes(instante: number): string {
  const nome = new Date(instante)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

/** Série semanal: cada ponto é o total da janela de 7 dias que termina na semana indicada. */
function porSemana(
  lista: readonly Ocorrencia[],
  agora: number,
  quantidade: number,
  valor: (janela: readonly Ocorrencia[]) => number,
): number[] {
  return Array.from({ length: quantidade }, (_, indice) => {
    const fim = agora - (quantidade - 1 - indice) * 7 * DIA_MS;
    return valor(entre(lista, fim - 7 * DIA_MS, fim + 1));
  });
}

/** A tendência só aparece quando há o que mostrar; uma linha reta em zero engana. */
function seHouverDados(serie: readonly number[]): readonly number[] | null {
  return serie.some((valor) => valor > 0) ? serie : null;
}

const VERBO_DO_EVENTO: Readonly<Record<string, string>> = {
  registro: "registrou",
  aprovacao: "aprovou",
  recusa: "recusou",
  encaminhamento: "encaminhou",
  observacao: "comentou em",
  classificacao: "reclassificou",
};

const COR_DO_MATERIAL: Readonly<Record<Material, string>> = {
  papelao: "var(--papelao-bg)",
  plastico: "var(--plastico-bg)",
  metal: "var(--metal-bg)",
  vidro: "var(--vidro-bg)",
};

function atividadesRecentes(
  lista: readonly Ocorrencia[],
  agora: number,
): readonly AtividadeEquipe[] {
  return lista
    .flatMap((o) =>
      o.historico
        .filter((evento) => evento.tipo in VERBO_DO_EVENTO)
        .map((evento) => ({ o, evento })),
    )
    .sort((a, b) => b.evento.em.localeCompare(a.evento.em))
    .slice(0, LIMITE_ATIVIDADES)
    .map(({ o, evento }) => ({
      id: `${o.id}:${evento.id}`,
      autor: evento.autor,
      acao: `${VERBO_DO_EVENTO[evento.tipo]} ${o.codigo} · ${o.titulo}`,
      tempo: tempoRelativo(evento.em, agora),
      cor: o.material ? COR_DO_MATERIAL[o.material] : "var(--vidro-bg)",
    }));
}

/** Duração em texto corrido: "20 min", "8 h", "1 dia", "3 dias". */
function duracao(desde: number, agora: number): string {
  const minutos = Math.max(Math.round((agora - desde) / 60_000), 1);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.round(horas / 24);
  return `${dias} ${dias === 1 ? "dia" : "dias"}`;
}

function textoDeEspera(pendentes: readonly Ocorrencia[], agora: number): string {
  if (pendentes.length === 0) return "nada esperando";
  const maisAntiga = Math.min(...pendentes.map((o) => new Date(o.criadaEm).getTime()));
  return `a mais antiga espera ${duracao(maisAntiga, agora)}`;
}

function variacaoPct(atual: number, anterior: number): number | null {
  return anterior > 0 ? Math.round(((atual - anterior) / anterior) * 100) : null;
}

/**
 * Números do Início calculados das ocorrências da API. O mês é o do calendário;
 * a recuperação conta só o que já foi aprovado (a API não informa a data da
 * aprovação, então vale a data do registro).
 */
export function calcularPainel(
  ocorrencias: readonly Ocorrencia[],
  metaMensalKg: number,
  agora: Date = new Date(),
): PainelInicio {
  const instante = agora.getTime();
  const aprovadas = ocorrencias.filter(aprovada);
  const esteMes = entre(ocorrencias, inicioDoMes(agora, 0), inicioDoMes(agora, 1));
  const mesPassado = entre(ocorrencias, inicioDoMes(agora, -1), inicioDoMes(agora, 0));
  const recuperadoMesKg = somaKg(esteMes.filter(aprovada));
  const recuperadoPassadoKg = somaKg(mesPassado.filter(aprovada));
  const taxa = taxaDeAprovacao(esteMes);
  const taxaPassada = taxaDeAprovacao(mesPassado);

  const porMaterial = MATERIAIS.map((material) => ({
    material,
    kg: Math.round(
      somaKg(esteMes.filter((o) => aprovada(o) && o.material === material)),
    ),
  }));
  const dosQuatro = porMaterial.reduce((total, item) => total + item.kg, 0);

  const metaSemanal = Math.round((metaMensalKg * 7) / 30);
  const semanas: readonly PontoRecuperacao[] = porSemana(
    aprovadas,
    instante,
    SEMANAS_NO_PAINEL,
    somaKg,
  ).map((valor, indice) => ({
    rotulo: `S${indice + 1}`,
    valor: Math.round(valor),
    meta: metaSemanal,
  }));

  const meses: readonly PontoRecuperacao[] = Array.from(
    { length: MESES_NO_TRIMESTRE },
    (_, indice) => {
      const inicio = inicioDoMes(agora, indice - (MESES_NO_TRIMESTRE - 1));
      const fim = inicioDoMes(agora, indice - (MESES_NO_TRIMESTRE - 2));
      return {
        rotulo: rotuloDoMes(inicio),
        valor: Math.round(somaKg(entre(aprovadas, inicio, fim))),
        meta: metaMensalKg,
      };
    },
  );

  return {
    ocorrenciasMes: esteMes.length,
    ocorrenciasVariacao:
      mesPassado.length > 0 ? esteMes.length - mesPassado.length : null,
    sparkOcorrencias: seHouverDados(
      porSemana(ocorrencias, instante, SEMANAS_NA_TENDENCIA, (janela) => janela.length),
    ),
    recuperadoMesKg: Math.round(recuperadoMesKg),
    recuperadoVariacaoPct: variacaoPct(recuperadoMesKg, recuperadoPassadoKg),
    sparkRecuperado: seHouverDados(
      porSemana(aprovadas, instante, SEMANAS_NA_TENDENCIA, somaKg).map(Math.round),
    ),
    taxaAprovacao: taxa,
    taxaVariacaoPontos:
      taxa !== null && taxaPassada !== null ? taxa - taxaPassada : null,
    sparkTaxa: null,
    textoEspera: textoDeEspera(ocorrencias.filter(aguardando), instante),
    sparkPendentes: null,
    porMaterial,
    outrosKg: Math.max(0, Math.round(recuperadoMesKg) - dosQuatro),
    semanas,
    meses,
    atividades: atividadesRecentes(ocorrencias, instante),
  };
}
