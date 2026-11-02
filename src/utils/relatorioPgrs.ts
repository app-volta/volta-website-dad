import type { ColetaApi, MetricaEsgApi } from "../types/api";
import { MATERIAIS } from "../types/material";
import type { Material } from "../types/material";
import type { Ocorrencia } from "../types/ocorrencia";
import type {
  DestinacaoCooperativa,
  GeracaoPorSetor,
  OcorrenciaDoRelatorio,
  OcorrenciasDoSetor,
  PeriodoAnterior,
  PeriodoRelatorio,
  PosicaoNoRanking,
  RecorrenciaNoPeriodo,
  RelatorioPgrs,
} from "../types/relatorio";
import { instanteUtc } from "./datas";
import {
  aprovada,
  entre,
  inicioDoMes,
  somaKg,
  taxaDeAprovacao,
} from "./painel";

const LIMITE_SETORES = 5;
const LIMITE_COOPERATIVAS = 5;
/** Ocorrências aprovadas que o documento do PGRS mostra como amostra. */
const LIMITE_AMOSTRA = 4;
/** Setores mostrados no gráfico de ocorrências; os demais se juntam em "Outros setores". */
const LIMITE_SETORES_NO_GRAFICO = 8;
const NOME_OUTROS_SETORES = "Outros setores";

/** O que o relatório lê da API, já carregado. */
export interface EntradaRelatorio {
  readonly ocorrencias: readonly Ocorrencia[];
  readonly metricas: readonly MetricaEsgApi[];
  readonly scoreEsg: number | null;
  readonly posicaoNoRanking: PosicaoNoRanking | null;
  readonly coletas: readonly ColetaApi[];
  /** Nome de cada cooperativa pelo id; vazio quando a pessoa não pode listá-las. */
  readonly nomesCooperativas: ReadonlyMap<string, string>;
}

interface Intervalo {
  readonly de: number;
  readonly ate: number;
  /** Primeiro e último mês (AAAA-MM) do período, para filtrar as métricas ESG. */
  readonly mesInicial: string;
  readonly mesFinal: string;
}

function chaveDoMes(instante: number): string {
  const data = new Date(instante);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

/** Mês do calendário, últimos três meses (com o atual) ou ano do calendário. */
export function intervaloDoPeriodo(periodo: PeriodoRelatorio, agora: Date): Intervalo {
  const inicioMeses = periodo === "mes" ? 0 : periodo === "trimestre" ? -2 : -agora.getMonth();
  const de = inicioDoMes(agora, inicioMeses);
  const ate =
    periodo === "ano"
      ? new Date(agora.getFullYear() + 1, 0, 1).getTime()
      : inicioDoMes(agora, 1);
  return {
    de,
    ate,
    mesInicial: chaveDoMes(de),
    mesFinal: chaveDoMes(ate - 1),
  };
}

/** O período de mesmo tamanho que termina onde o de `periodo` começa. */
export function intervaloAnterior(periodo: PeriodoRelatorio, agora: Date): Intervalo {
  const atual = intervaloDoPeriodo(periodo, agora);
  const de =
    periodo === "ano"
      ? new Date(agora.getFullYear() - 1, 0, 1).getTime()
      : inicioDoMes(new Date(atual.de), periodo === "mes" ? -1 : -3);
  return { de, ate: atual.de, mesInicial: chaveDoMes(de), mesFinal: chaveDoMes(atual.de - 1) };
}

export function rotuloDoAnterior(periodo: PeriodoRelatorio, intervalo: Intervalo): string {
  if (periodo === "trimestre") return "o trimestre anterior";
  const data = new Date(intervalo.de);
  return periodo === "ano"
    ? String(data.getFullYear())
    : data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function periodoAnterior(
  periodo: PeriodoRelatorio,
  ocorrencias: readonly Ocorrencia[],
  agora: Date,
): PeriodoAnterior | null {
  const intervalo = intervaloAnterior(periodo, agora);
  const doPeriodo = entre(ocorrencias, intervalo.de, intervalo.ate);
  if (doPeriodo.length === 0) return null;
  return {
    rotulo: rotuloDoAnterior(periodo, intervalo),
    ocorrencias: doPeriodo.length,
    recuperadoKg: Math.round(somaKg(doPeriodo.filter(aprovada))),
    taxaAprovacao: taxaDeAprovacao(doPeriodo),
  };
}

function desvioDoAterro(
  intervalo: Intervalo,
  metricas: readonly MetricaEsgApi[],
  subconjunto: readonly Ocorrencia[],
): number | null {
  // O cálculo oficial da empresa, quando há métricas ESG lançadas no período.
  const doPeriodo = metricas.filter(
    (m) => m.period >= intervalo.mesInicial && m.period <= intervalo.mesFinal,
  );
  const gerado = doPeriodo.reduce((soma, m) => soma + m.totalWasteKg, 0);
  if (gerado > 0) {
    const reciclado = doPeriodo.reduce((soma, m) => soma + m.totalRecycledKg, 0);
    return Math.round((reciclado / gerado) * 100);
  }

  // Sem métricas: o que foi aprovado sobre tudo o que foi registrado e não recusado.
  const total = somaKg(subconjunto.filter((o) => o.status !== "recusada"));
  if (total <= 0) return null;
  return Math.round((somaKg(subconjunto.filter(aprovada)) / total) * 100);
}

/** Todos os setores com peso, do que mais gera para o que menos gera. */
function setoresPorPeso(subconjunto: readonly Ocorrencia[]): readonly GeracaoPorSetor[] {
  const porSetor = new Map<string, number>();
  for (const o of subconjunto) {
    porSetor.set(o.localizacao.setor, (porSetor.get(o.localizacao.setor) ?? 0) + o.pesoKg);
  }
  return [...porSetor]
    .map(([nome, kg]) => ({ nome, kg: Math.round(kg) }))
    .filter((setor) => setor.kg > 0)
    .sort((a, b) => b.kg - a.kg);
}

function geracaoPorSetor(subconjunto: readonly Ocorrencia[]): readonly GeracaoPorSetor[] {
  return setoresPorPeso(subconjunto).slice(0, LIMITE_SETORES);
}

/** O par setor + tipo de resíduo que mais se repetiu, se alguma vez passou de uma ocorrência. */
function recorrenciaNoPeriodo(subconjunto: readonly Ocorrencia[]): RecorrenciaNoPeriodo | null {
  const contagem = new Map<string, RecorrenciaNoPeriodo>();
  for (const o of subconjunto) {
    const chave = `${o.localizacao.setor}|${o.titulo.toLowerCase()}`;
    const atual = contagem.get(chave);
    contagem.set(chave, {
      setor: o.localizacao.setor,
      titulo: o.titulo,
      vezes: (atual?.vezes ?? 0) + 1,
    });
  }
  const mais = [...contagem.values()].sort(
    (a, b) =>
      b.vezes - a.vezes ||
      a.setor.localeCompare(b.setor, "pt-BR") ||
      a.titulo.localeCompare(b.titulo, "pt-BR"),
  )[0];
  return mais && mais.vezes >= 2 ? mais : null;
}

/** As ocorrências aprovadas mais recentes, para a amostra do documento. */
function aprovadasRecentes(aprovadas: readonly Ocorrencia[]): readonly OcorrenciaDoRelatorio[] {
  return [...aprovadas]
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
    .slice(0, LIMITE_AMOSTRA)
    .map((o) => ({
      id: o.id,
      codigo: o.codigo,
      titulo: o.titulo,
      setor: o.localizacao.setor,
      material: o.material,
      pesoKg: o.pesoKg,
      registradaPor: o.criadaPorNome,
    }));
}

/** Conta as ocorrências de cada setor, recusadas e pendentes incluídas. */
function ocorrenciasPorSetor(
  subconjunto: readonly Ocorrencia[],
): readonly OcorrenciasDoSetor[] {
  const contagem = new Map<string, number>();
  for (const o of subconjunto) {
    contagem.set(o.localizacao.setor, (contagem.get(o.localizacao.setor) ?? 0) + 1);
  }
  const ordenados = [...contagem]
    .map(([nome, ocorrencias]) => ({ nome, ocorrencias }))
    .sort(
      (a, b) => b.ocorrencias - a.ocorrencias || a.nome.localeCompare(b.nome, "pt-BR"),
    );
  if (ordenados.length <= LIMITE_SETORES_NO_GRAFICO) return ordenados;

  const principais = ordenados.slice(0, LIMITE_SETORES_NO_GRAFICO - 1);
  const outros = ordenados
    .slice(LIMITE_SETORES_NO_GRAFICO - 1)
    .reduce((soma, setor) => soma + setor.ocorrencias, 0);
  return [...principais, { nome: NOME_OUTROS_SETORES, ocorrencias: outros }];
}

function destinacaoPorCooperativa(
  intervalo: Intervalo,
  entrada: EntradaRelatorio,
): readonly DestinacaoCooperativa[] {
  const pesoPorOcorrencia = new Map(entrada.ocorrencias.map((o) => [o.id, o.pesoKg]));
  const materialPorOcorrencia = new Map(entrada.ocorrencias.map((o) => [o.id, o.material]));
  const doPeriodo = entrada.coletas.filter((c) => {
    const instante = new Date(instanteUtc(c.requestedAt)).getTime();
    return instante >= intervalo.de && instante < intervalo.ate && c.currentStatus !== "CANCELED";
  });

  const porCooperativa = new Map<
    string,
    { coletas: number; kg: number; materiais: ReadonlySet<Material> }
  >();
  for (const coleta of doPeriodo) {
    const atual = porCooperativa.get(coleta.cooperativeId) ?? {
      coletas: 0,
      kg: 0,
      materiais: new Set<Material>(),
    };
    const material = materialPorOcorrencia.get(coleta.incidentId);
    porCooperativa.set(coleta.cooperativeId, {
      coletas: atual.coletas + 1,
      kg: atual.kg + (pesoPorOcorrencia.get(coleta.incidentId) ?? 0),
      materiais: material ? new Set([...atual.materiais, material]) : atual.materiais,
    });
  }

  // Divide pelo peso; se nenhuma coleta tem peso estimado, pela quantidade de coletas.
  const totalKg = [...porCooperativa.values()].reduce((soma, c) => soma + c.kg, 0);
  const porPeso = totalKg > 0;
  const total = porPeso ? totalKg : doPeriodo.length;

  return [...porCooperativa]
    .map(([cooperativaId, dados]) => ({
      cooperativaId,
      nome:
        entrada.nomesCooperativas.get(cooperativaId) ??
        `Cooperativa ${cooperativaId.slice(0, 4).toUpperCase()}`,
      percentual: Math.round(((porPeso ? dados.kg : dados.coletas) / total) * 100),
      ...(dados.kg > 0 ? { kg: Math.round(dados.kg) } : {}),
      materiais: MATERIAIS.filter((material) => dados.materiais.has(material)),
    }))
    .sort((a, b) => b.percentual - a.percentual)
    .slice(0, LIMITE_COOPERATIVAS);
}

/**
 * Relatório PGRS montado do que a API já devolve. A volta-api não tem um
 * endpoint de relatório: contagens, setores e materiais saem das ocorrências,
 * a destinação das coletas e, quando a empresa lançou métricas ESG, o desvio do
 * aterro vem delas.
 */
export function calcularRelatorio(
  periodo: PeriodoRelatorio,
  entrada: EntradaRelatorio,
  agora: Date = new Date(),
): RelatorioPgrs {
  const intervalo = intervaloDoPeriodo(periodo, agora);
  const subconjunto = entre(entrada.ocorrencias, intervalo.de, intervalo.ate);
  const aprovadas = subconjunto.filter(aprovada);

  return {
    periodo,
    ocorrencias: subconjunto.length,
    recuperadoKg: Math.round(somaKg(aprovadas)),
    taxaAprovacao: taxaDeAprovacao(subconjunto),
    desvioAterro: desvioDoAterro(intervalo, entrada.metricas, subconjunto),
    porMaterial: MATERIAIS.map((material) => ({
      material,
      kg: Math.round(somaKg(aprovadas.filter((o) => o.material === material))),
    })),
    setores: geracaoPorSetor(subconjunto),
    ocorrenciasPorSetor: ocorrenciasPorSetor(subconjunto),
    destinacao: destinacaoPorCooperativa(intervalo, entrada),
    scoreEsg: entrada.scoreEsg,
    posicaoNoRanking: entrada.posicaoNoRanking,
    anterior: periodoAnterior(periodo, entrada.ocorrencias, agora),
    setoresRecuperados: setoresPorPeso(aprovadas),
    aprovadasRecentes: aprovadasRecentes(aprovadas),
    recorrencia: recorrenciaNoPeriodo(subconjunto),
  };
}
