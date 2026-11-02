import type { UnidadeConfiguracao } from "../types/configuracao";
import type { Cooperativa } from "../types/cooperativa";
import { ROTULOS_MATERIAL_ACEITO } from "../types/cooperativa";
import { METADADOS_MATERIAL } from "../types/material";
import type { PeriodoRelatorio, RelatorioPgrs } from "../types/relatorio";
import type { EstadoLicenca } from "./cooperativas";
import { diasParaVencer, estadoLicenca, rotuloLicenca } from "./cooperativas";
import { formatarKm, formatarPeso } from "./formatacao";
import { intervaloDoPeriodo } from "./relatorioPgrs";

/** Setores que aparecem com o nome; os demais viram "Outros N setores". */
const SETORES_NO_DOCUMENTO = 5;

export interface ContextoDoDocumento {
  /** Dados do cartão Unidade das Configurações; nulo quando a pessoa não pode lê-los. */
  readonly unidade: UnidadeConfiguracao | null;
  /** Nome da unidade da sessão, usado quando a empresa não informa o dela. */
  readonly nomeDaUnidade: string;
  readonly responsavel: { readonly nome: string; readonly funcao: string };
  /** Meta de recuperação do mês, em kg; zero quando a empresa não definiu. */
  readonly metaMensalKg: number;
  /** As cooperativas conhecidas (licença, distância e materiais); vazio quando a API não deixa listar. */
  readonly cooperativas: readonly Cooperativa[];
  readonly agora: Date;
}

export type TomDoCartao = "bom" | "ruim" | "neutro";

export interface CartaoDoDocumento {
  readonly rotulo: string;
  readonly valor: string;
  readonly unidade: string | null;
  readonly rodape: string | null;
  readonly tom: TomDoCartao;
}

export interface LinhaDeBarra {
  readonly rotulo: string;
  readonly valor: string;
  readonly percentual: string;
  /** Largura da barra de 0 a 100, em relação à maior linha. */
  readonly barra: number;
  /** Linha dos setores que ficaram de fora (cinza). */
  readonly resto: boolean;
}

export type TomDaLicenca = "valida" | "vencendo" | "problema" | "neutra";

export interface LinhaDeCooperativa {
  readonly nome: string;
  readonly distancia: string | null;
  readonly materiais: string;
  readonly destinado: string;
  readonly parcela: string;
  readonly licenca: string;
  readonly tomDaLicenca: TomDaLicenca;
}

export interface LinhaDeOcorrencia {
  readonly id: string;
  readonly codigo: string;
  readonly titulo: string;
  readonly setor: string;
  readonly material: string;
  readonly peso: string;
  readonly registradaPor: string;
}

export interface DocumentoPgrs {
  readonly pill: string;
  /** O selo do alto da segunda página: "RELATÓRIO PGRS · OUTUBRO DE 2026". */
  readonly pillDaSegundaPagina: string;
  readonly titulo: string;
  readonly subtitulo: string;
  readonly identificacao: readonly { readonly rotulo: string; readonly valor: string }[];
  readonly resumo: {
    readonly titulo: string;
    readonly comparacao: string | null;
    readonly cartoes: readonly CartaoDoDocumento[];
  };
  readonly meta: {
    readonly atingido: string;
    readonly total: string;
    readonly percentual: number;
  } | null;
  readonly materiais: { readonly linhas: readonly LinhaDeBarra[]; readonly total: string };
  readonly setores: { readonly linhas: readonly LinhaDeBarra[] };
  readonly destinacao: {
    readonly subtitulo: string;
    readonly linhas: readonly LinhaDeCooperativa[];
    readonly totalDestinado: string;
    readonly totalParcela: string;
  } | null;
  readonly ocorrencias: readonly LinhaDeOcorrencia[];
  readonly recomendacoes: { readonly titulo: string; readonly itens: readonly string[] } | null;
  readonly declaracao: string;
  readonly responsavel: { readonly nome: string; readonly funcao: string };
  readonly rodape: string;
  readonly nomeDoArquivo: string;
}

const SEM_DADO = "—";

function numero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

function umaCasa(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, "0");
}

function dataCurta(data: Date): string {
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()}`;
}

function mesLongo(data: Date): string {
  return data.toLocaleDateString("pt-BR", { month: "long" });
}

function mesEAno(data: Date): string {
  return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/** "outubro de 2026", "agosto a outubro de 2026" ou "2026". */
function nomeDoPeriodo(periodo: PeriodoRelatorio, de: Date, agora: Date): string {
  if (periodo === "mes") return mesEAno(agora);
  if (periodo === "ano") return String(agora.getFullYear());
  return de.getFullYear() === agora.getFullYear()
    ? `${mesLongo(de)} a ${mesEAno(agora)}`
    : `${mesEAno(de)} a ${mesEAno(agora)}`;
}

/** "01/10 a 31/10/2026": o período inteiro, ou até hoje enquanto ele ainda não terminou. */
function intervaloEmTexto(de: Date, ateExclusivo: number, agora: Date): string {
  const ultimoDia = new Date(Math.min(ateExclusivo - 1, agora.getTime()));
  const inicio =
    de.getFullYear() === ultimoDia.getFullYear()
      ? `${doisDigitos(de.getDate())}/${doisDigitos(de.getMonth() + 1)}`
      : dataCurta(de);
  return `${inicio} a ${dataCurta(ultimoDia)}`;
}

function emitidoEm(agora: Date): string {
  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dataCurta(agora)}, ${hora}`;
}

/** "outubro/2026", "ago–out/2026" ou "2026": a referência curta do rodapé e do nome do arquivo. */
function referenciaCurta(periodo: PeriodoRelatorio, de: Date, agora: Date): string {
  if (periodo === "ano") return String(agora.getFullYear());
  if (periodo === "mes") return `${mesLongo(agora)}/${agora.getFullYear()}`;
  const abreviado = (data: Date): string => mesLongo(data).slice(0, 3);
  return `${abreviado(de)}–${abreviado(agora)}/${agora.getFullYear()}`;
}

function listaEmTexto(itens: readonly string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

function sinal(valor: number): string {
  return valor > 0 ? `+${numero(valor)}` : numero(valor);
}

function tomDaVariacao(valor: number): TomDoCartao {
  return valor > 0 ? "bom" : valor < 0 ? "ruim" : "neutro";
}

function seta(valor: number): string {
  return valor > 0 ? "↑" : valor < 0 ? "↓" : "→";
}

/** O "vs. setembro" curto: só o nome do mês, ou "trimestre anterior" / o ano. */
function rotuloCurtoDoAnterior(periodo: PeriodoRelatorio, rotulo: string): string {
  if (periodo === "mes") return rotulo.split(" ")[0];
  return periodo === "trimestre" ? "trimestre anterior" : rotulo;
}

function cartoes(relatorio: RelatorioPgrs): readonly CartaoDoDocumento[] {
  const anterior = relatorio.anterior ?? null;
  const contra = anterior ? rotuloCurtoDoAnterior(relatorio.periodo, anterior.rotulo) : "";

  const dOcorrencias = anterior ? relatorio.ocorrencias - anterior.ocorrencias : null;
  const dRecuperado =
    anterior && anterior.recuperadoKg > 0
      ? Math.round(((relatorio.recuperadoKg - anterior.recuperadoKg) / anterior.recuperadoKg) * 100)
      : null;
  const dTaxa =
    anterior && anterior.taxaAprovacao !== null && relatorio.taxaAprovacao !== null
      ? relatorio.taxaAprovacao - anterior.taxaAprovacao
      : null;

  return [
    {
      rotulo: "Ocorrências",
      valor: numero(relatorio.ocorrencias),
      unidade: null,
      rodape: dOcorrencias === null ? null : `${seta(dOcorrencias)} ${sinal(dOcorrencias)} vs. ${contra}`,
      tom: dOcorrencias === null ? "neutro" : tomDaVariacao(dOcorrencias),
    },
    {
      rotulo: "Recuperado",
      valor: numero(relatorio.recuperadoKg),
      unidade: "kg",
      rodape: dRecuperado === null ? null : `${seta(dRecuperado)} ${sinal(dRecuperado)}% vs. ${contra}`,
      tom: dRecuperado === null ? "neutro" : tomDaVariacao(dRecuperado),
    },
    {
      rotulo: "Taxa de aprovação",
      valor: relatorio.taxaAprovacao === null ? SEM_DADO : String(relatorio.taxaAprovacao),
      unidade: relatorio.taxaAprovacao === null ? null : "%",
      rodape:
        dTaxa === null ? null : `${seta(dTaxa)} ${sinal(dTaxa)} ${Math.abs(dTaxa) === 1 ? "ponto" : "pontos"}`,
      tom: dTaxa === null ? "neutro" : tomDaVariacao(dTaxa),
    },
    {
      rotulo: "Desviado de aterro",
      valor: relatorio.desvioAterro === null ? SEM_DADO : String(relatorio.desvioAterro),
      unidade: relatorio.desvioAterro === null ? null : "%",
      rodape: "do volume registrado",
      tom: "neutro",
    },
  ];
}

function linhasDeBarra(
  itens: readonly { readonly rotulo: string; readonly kg: number; readonly resto?: boolean }[],
  totalKg: number,
): readonly LinhaDeBarra[] {
  const maior = Math.max(...itens.map((item) => item.kg), 0);
  return itens.map((item) => ({
    rotulo: item.rotulo,
    valor: `${numero(item.kg)} kg`,
    percentual: totalKg > 0 ? `${umaCasa((item.kg / totalKg) * 100)}%` : SEM_DADO,
    barra: maior > 0 ? Math.round((item.kg / maior) * 100) : 0,
    resto: item.resto === true,
  }));
}

function materiais(relatorio: RelatorioPgrs): DocumentoPgrs["materiais"] {
  const itens: { rotulo: string; kg: number; resto?: boolean }[] = relatorio.porMaterial.map(
    (item) => ({ rotulo: METADADOS_MATERIAL[item.material].rotulo, kg: item.kg }),
  );
  // Madeira, perigoso e outros não têm linha própria, mas contam no total recuperado.
  const dosQuatro = itens.reduce((soma, item) => soma + item.kg, 0);
  if (relatorio.recuperadoKg > dosQuatro) {
    itens.push({ rotulo: "Outros materiais", kg: relatorio.recuperadoKg - dosQuatro, resto: true });
  }
  return {
    linhas: linhasDeBarra(itens, relatorio.recuperadoKg),
    total: `${numero(relatorio.recuperadoKg)} kg`,
  };
}

function setores(relatorio: RelatorioPgrs): DocumentoPgrs["setores"] {
  const todos = relatorio.setoresRecuperados ?? relatorio.setores;
  const principais = todos.slice(0, SETORES_NO_DOCUMENTO);
  const demais = todos.slice(SETORES_NO_DOCUMENTO);
  const itens: { rotulo: string; kg: number; resto?: boolean }[] = principais.map((setor) => ({
    rotulo: setor.nome,
    kg: setor.kg,
  }));
  if (demais.length > 0) {
    itens.push({
      rotulo: `Outros ${demais.length} ${demais.length === 1 ? "setor" : "setores"}`,
      kg: demais.reduce((soma, setor) => soma + setor.kg, 0),
      resto: true,
    });
  }
  const total = todos.reduce((soma, setor) => soma + setor.kg, 0);
  return { linhas: linhasDeBarra(itens, relatorio.recuperadoKg > 0 ? relatorio.recuperadoKg : total) };
}

const TOM_DA_LICENCA: Readonly<Record<EstadoLicenca, TomDaLicenca>> = {
  valida: "valida",
  vencendo: "vencendo",
  vencida: "problema",
  em_analise: "neutra",
  sem_licenca: "neutra",
  nao_informada: "neutra",
};

function destinacao(
  relatorio: RelatorioPgrs,
  contexto: ContextoDoDocumento,
): DocumentoPgrs["destinacao"] {
  if (relatorio.destinacao.length === 0) return null;
  const porId = new Map(contexto.cooperativas.map((coop) => [coop.id, coop]));

  const linhas: LinhaDeCooperativa[] = relatorio.destinacao.map((item) => {
    const coop = porId.get(item.cooperativaId);
    const materiaisRecebidos = (item.materiais ?? []).map((m) => METADADOS_MATERIAL[m].rotulo);
    const materiaisAceitos = (coop?.materiaisAceitos ?? []).map((m) => ROTULOS_MATERIAL_ACEITO[m]);
    const nomes = materiaisRecebidos.length > 0 ? materiaisRecebidos : materiaisAceitos;
    const textoDosMateriais = listaEmTexto(
      nomes.map((nome, indice) => (indice === 0 ? nome : nome.toLowerCase())),
    );
    return {
      nome: item.nome,
      distancia: coop && coop.distanciaKm !== null ? `${formatarKm(coop.distanciaKm)} da unidade` : null,
      materiais: textoDosMateriais || SEM_DADO,
      destinado: item.kg === undefined ? SEM_DADO : `${numero(item.kg)} kg`,
      parcela: `${item.percentual}%`,
      licenca: coop ? rotuloLicenca(coop, contexto.agora, true).toUpperCase() : "NÃO INFORMADA",
      tomDaLicenca: coop ? TOM_DA_LICENCA[estadoLicenca(coop, contexto.agora)] : "neutra",
    };
  });

  const comTodasConhecidas = relatorio.destinacao.every((item) => porId.has(item.cooperativaId));
  const todasHomologadas =
    comTodasConhecidas &&
    relatorio.destinacao.every((item) => porId.get(item.cooperativaId)?.situacao === "ativa");
  const kgConhecidos = relatorio.destinacao.filter((item) => item.kg !== undefined);
  const somaDasParcelas = relatorio.destinacao.reduce((soma, item) => soma + item.percentual, 0);

  return {
    subtitulo: todasHomologadas
      ? "todo o material recuperado foi destinado a parceiras homologadas"
      : "material recuperado destinado às cooperativas parceiras",
    linhas,
    totalDestinado:
      kgConhecidos.length === 0
        ? SEM_DADO
        : `${numero(kgConhecidos.reduce((soma, item) => soma + (item.kg ?? 0), 0))} kg`,
    totalParcela: `${Math.min(100, somaDasParcelas)}%`,
  };
}

function ocorrencias(relatorio: RelatorioPgrs): readonly LinhaDeOcorrencia[] {
  return (relatorio.aprovadasRecentes ?? []).map((item) => ({
    id: item.id,
    codigo: item.codigo,
    titulo: item.titulo,
    setor: item.setor,
    material: item.material ? METADADOS_MATERIAL[item.material].rotulo : SEM_DADO,
    peso: formatarPeso(item.pesoKg, true),
    registradaPor: item.registradaPor,
  }));
}

function recomendacoes(
  relatorio: RelatorioPgrs,
  contexto: ContextoDoDocumento,
  periodoNoTexto: string,
): readonly string[] {
  const itens: string[] = [];

  if (relatorio.recorrencia) {
    const { setor, titulo, vezes } = relatorio.recorrencia;
    itens.push(
      `No setor ${setor}, "${titulo.toLowerCase()}" foi registrado ${vezes} vezes ${periodoNoTexto}. Vale uma ação preventiva no setor.`,
    );
  }

  const idsDaDestinacao = new Set(relatorio.destinacao.map((item) => item.cooperativaId));
  const comLicencaEmRisco = contexto.cooperativas
    .filter((coop) => idsDaDestinacao.has(coop.id) || relatorio.destinacao.length === 0)
    .map((coop) => ({ coop, estado: estadoLicenca(coop, contexto.agora) }))
    .filter(({ estado }) => estado === "vencendo" || estado === "vencida")
    .sort((a, b) => diasParaVencer(a.coop.licencaValidaAte ?? "", contexto.agora) - diasParaVencer(b.coop.licencaValidaAte ?? "", contexto.agora))[0];
  if (comLicencaEmRisco) {
    const { coop, estado } = comLicencaEmRisco;
    const dias = diasParaVencer(coop.licencaValidaAte ?? "", contexto.agora);
    itens.push(
      estado === "vencida"
        ? `A licença ambiental da ${coop.nome} está vencida. Regularize antes de enviar novas coletas.`
        : dias === 0
          ? `A licença ambiental da ${coop.nome} vence hoje. Peça a renovação antes da próxima coleta.`
          : `A licença ambiental da ${coop.nome} vence em ${dias} ${dias === 1 ? "dia" : "dias"}. Peça a renovação antes da próxima coleta.`,
    );
  }

  if (relatorio.periodo === "mes" && contexto.metaMensalKg > 0) {
    const falta = contexto.metaMensalKg - relatorio.recuperadoKg;
    const lider = (relatorio.setoresRecuperados ?? relatorio.setores)[0];
    itens.push(
      falta > 0
        ? `Faltam ${numero(falta)} kg para a meta mensal de ${numero(contexto.metaMensalKg)} kg.${lider ? ` ${lider.nome} é o setor que mais gera resíduo: é onde há mais a recuperar.` : ""}`
        : `A meta mensal de ${numero(contexto.metaMensalKg)} kg foi atingida. Vale rever a meta do próximo mês.`,
    );
  }
  return itens;
}

function proximoPeriodo(periodo: PeriodoRelatorio, agora: Date): string {
  if (periodo !== "mes") return "o próximo período";
  return mesLongo(new Date(agora.getFullYear(), agora.getMonth() + 1, 1));
}

const PILL: Readonly<Record<PeriodoRelatorio, string>> = {
  mes: "RELATÓRIO MENSAL · PGRS",
  trimestre: "RELATÓRIO TRIMESTRAL · PGRS",
  ano: "RELATÓRIO ANUAL · PGRS",
};

const TITULO_DO_RESUMO: Readonly<Record<PeriodoRelatorio, string>> = {
  mes: "Resumo do mês",
  trimestre: "Resumo do trimestre",
  ano: "Resumo do ano",
};

/**
 * O conteúdo do documento do PGRS (o PDF que a pessoa salva pelo navegador), já
 * com os textos formatados. Montado do relatório da API, do cartão Unidade, da
 * meta e da lista de cooperativas; o que não existe vira traço ou some, nunca
 * é inventado.
 */
export function montarDocumentoPgrs(
  relatorio: RelatorioPgrs,
  contexto: ContextoDoDocumento,
): DocumentoPgrs {
  const { agora } = contexto;
  const intervalo = intervaloDoPeriodo(relatorio.periodo, agora);
  const de = new Date(intervalo.de);
  const nome = nomeDoPeriodo(relatorio.periodo, de, agora);
  const referencia = referenciaCurta(relatorio.periodo, de, agora);
  const unidadeNome = contexto.unidade?.nome || contexto.nomeDaUnidade || "Unidade";
  const periodoEmTexto = intervaloEmTexto(de, intervalo.ate, agora);
  const anterior = relatorio.anterior ?? null;
  const itensDaRecomendacao = recomendacoes(
    relatorio,
    contexto,
    relatorio.periodo === "mes" ? "neste mês" : "no período",
  );

  const percentualDaMeta =
    contexto.metaMensalKg > 0 ? Math.round((relatorio.recuperadoKg / contexto.metaMensalKg) * 100) : 0;
  const setoresCadastrados = contexto.unidade?.setores ?? 0;

  return {
    pill: PILL[relatorio.periodo],
    pillDaSegundaPagina: `RELATÓRIO PGRS · ${nome.toUpperCase()}`,
    titulo: `Relatório de resíduos · ${nome}`,
    subtitulo:
      "Plano de Gerenciamento de Resíduos Sólidos · ocorrências aprovadas, recuperação por material e destinação final",
    identificacao: [
      { rotulo: "Unidade", valor: unidadeNome },
      { rotulo: "CNPJ", valor: contexto.unidade?.cnpj || SEM_DADO },
      { rotulo: "Endereço", valor: contexto.unidade?.endereco || SEM_DADO },
      {
        rotulo: "Setores",
        valor:
          setoresCadastrados > 0
            ? `${setoresCadastrados} ${setoresCadastrados === 1 ? "cadastrado" : "cadastrados"}`
            : SEM_DADO,
      },
      { rotulo: "Período", valor: periodoEmTexto },
      { rotulo: "Responsável", valor: contexto.responsavel.nome || SEM_DADO },
      { rotulo: "Função", valor: contexto.responsavel.funcao || SEM_DADO },
      { rotulo: "Emitido em", valor: emitidoEm(agora) },
    ],
    resumo: {
      titulo: TITULO_DO_RESUMO[relatorio.periodo],
      comparacao: anterior ? `comparado com ${anterior.rotulo}` : null,
      cartoes: cartoes(relatorio),
    },
    meta:
      relatorio.periodo === "mes" && contexto.metaMensalKg > 0
        ? {
            atingido: `${numero(relatorio.recuperadoKg)} kg`,
            total: `${numero(contexto.metaMensalKg)} kg`,
            percentual: percentualDaMeta,
          }
        : null,
    materiais: materiais(relatorio),
    setores: setores(relatorio),
    destinacao: destinacao(relatorio, contexto),
    ocorrencias: ocorrencias(relatorio),
    recomendacoes:
      itensDaRecomendacao.length > 0
        ? {
            titulo: `Recomendações do VOLTA para ${proximoPeriodo(relatorio.periodo, agora)}`,
            itens: itensDaRecomendacao,
          }
        : null,
    declaracao: `Declaro que as informações deste relatório correspondem aos registros da ${unidadeNome} no período de ${periodoEmTexto}, aprovados no painel VOLTA.`,
    responsavel: contexto.responsavel,
    rodape: `VOLTA · Relatório PGRS · ${unidadeNome} · ${referencia}`,
    nomeDoArquivo: `pgrs-${referencia.replace("/", "-").replace("–", "-")}`,
  };
}
