import type { MensagemAssistente } from "../types/assistente";
import type { Ocorrencia } from "../types/ocorrencia";
import { criarArmazem } from "../utils/armazem";
import { estadoLicenca, rotuloLicenca } from "../utils/cooperativas";
import { numeroCurto, normalizar } from "../utils/busca";
import { aguardaAprovacao, categoriaDe } from "../utils/statusOcorrencia";
import { listarCooperativas } from "./cooperativas";
import { aguardar } from "./http";
import { listarOcorrencias } from "./ocorrencias";

/**
 * MOCK: substitua por chamada real quando o backend expuser /assistente.
 * As respostas são montadas a partir dos mesmos dados das telas; reconhece
 * poucos assuntos por palavra-chave, e o resto cai numa resposta de ajuda.
 */

export const SUGESTOES_ASSISTENTE: readonly string[] = [
  "O que está esperando aprovação?",
  "Resumo da semana",
  "Licenças vencendo",
];

interface EstadoConversa {
  readonly mensagens: readonly MensagemAssistente[];
  readonly pensando: boolean;
}

const conversa = criarArmazem<EstadoConversa>({ mensagens: [], pensando: false });

export const assinarConversa = conversa.assinar;
export const lerConversa = conversa.obter;

let contador = 0;
function proximoId(): string {
  contador += 1;
  return `msg-${contador}`;
}

function adicionar(mensagem: Omit<MensagemAssistente, "id">): void {
  const atual = conversa.obter();
  conversa.definir({
    ...atual,
    mensagens: [...atual.mensagens, { ...mensagem, id: proximoId() }],
  });
}

function definirPensando(pensando: boolean): void {
  conversa.definir({ ...conversa.obter(), pensando });
}

const PESO_PRIORIDADE = { alta: 0, media: 1, baixa: 2 } as const;

function pendentesPorUrgencia(ocorrencias: readonly Ocorrencia[]): readonly Ocorrencia[] {
  return ocorrencias
    .filter((o) => aguardaAprovacao(o.status))
    .sort((a, b) => PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade]);
}

async function licencasEmAtencao() {
  const cooperativas = await listarCooperativas();
  return cooperativas.filter((c) => {
    const estado = estadoLicenca(c);
    return estado === "vencendo" || estado === "vencida";
  });
}

type RespostaAssistente = Omit<MensagemAssistente, "id" | "autor">;

async function responderAprovacoes(): Promise<RespostaAssistente> {
  const pendentes = pendentesPorUrgencia(await listarOcorrencias());
  if (pendentes.length === 0) {
    return { trechos: [{ texto: "Fila zerada! Todas as ocorrências foram revisadas." }] };
  }
  const exemplos = pendentes
    .slice(0, 3)
    .map((o) => `${numeroCurto(o.codigo)} (${o.titulo})`)
    .join(", ");
  const maisUrgente = pendentes[0];
  return {
    trechos: [
      { texto: "Tem " },
      { texto: `${pendentes.length} ${pendentes.length === 1 ? "ocorrência" : "ocorrências"}`, destaque: true },
      { texto: ` esperando: ${exemplos}. A mais urgente é a ` },
      { texto: numeroCurto(maisUrgente.codigo), destaque: true },
      { texto: `, prioridade ${maisUrgente.prioridade === "media" ? "média" : maisUrgente.prioridade}.` },
    ],
    acao: { rotulo: "Abrir fila", destino: "/ocorrencias" },
  };
}

async function responderResumo(): Promise<RespostaAssistente> {
  const ocorrencias = await listarOcorrencias();
  const limite = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const semana = ocorrencias.filter((o) => new Date(o.criadaEm).getTime() >= limite);
  const contar = (categoria: ReturnType<typeof categoriaDe>): number =>
    semana.filter((o) => categoriaDe(o.status) === categoria).length;

  return {
    trechos: [
      { texto: "Nos últimos 7 dias a unidade registrou " },
      { texto: `${semana.length} ocorrências`, destaque: true },
      {
        texto: `: ${contar("aprovadas")} aprovadas, ${contar("aguardando")} aguardando, ${contar("encaminhadas")} encaminhadas e ${contar("recusadas")} recusadas.`,
      },
    ],
    acao: { rotulo: "Ver relatório", destino: "/relatorios" },
  };
}

async function responderLicencas(): Promise<RespostaAssistente> {
  const atencao = await licencasEmAtencao();
  if (atencao.length === 0) {
    return { trechos: [{ texto: "Todas as licenças das cooperativas estão em dia." }] };
  }
  const coop = atencao[0];
  return {
    trechos: [
      { texto: "A licença da " },
      { texto: coop.nome, destaque: true },
      { texto: ` está com status "${rotuloLicenca(coop).toLowerCase()}". Peça a renovação antes de mandar mais material.` },
    ],
    acao: { rotulo: "Ver cooperativas", destino: "/cooperativas" },
  };
}

function responderAjuda(): RespostaAssistente {
  return {
    trechos: [
      { texto: "Ainda sei responder sobre poucos assuntos. Tente perguntar sobre " },
      { texto: "aprovações", destaque: true },
      { texto: ", o " },
      { texto: "resumo da semana", destaque: true },
      { texto: " ou as " },
      { texto: "licenças vencendo", destaque: true },
      { texto: "." },
    ],
  };
}

async function montarResposta(pergunta: string): Promise<RespostaAssistente> {
  const texto = normalizar(pergunta);
  if (/(aprov|fila|pendent|esperando)/.test(texto)) return responderAprovacoes();
  if (/(resumo|semana|balanco)/.test(texto)) return responderResumo();
  if (/(licen|vence|vencendo|cooperativ)/.test(texto)) return responderLicencas();
  return responderAjuda();
}

/** Primeira mensagem da conversa: um olhar rápido sobre a unidade. */
export async function iniciarConversa(): Promise<void> {
  if (conversa.obter().mensagens.length > 0) return;
  const [ocorrencias, atencao] = await Promise.all([listarOcorrencias(), licencasEmAtencao()]);
  if (conversa.obter().mensagens.length > 0) return;

  const pendentes = ocorrencias.filter((o) => aguardaAprovacao(o.status)).length;
  adicionar({
    autor: "assistente",
    trechos: [
      { texto: "Já dei uma olhada na unidade: tem " },
      { texto: `${pendentes} ${pendentes === 1 ? "ocorrência" : "ocorrências"}`, destaque: true },
      { texto: " pra aprovar" },
      ...(atencao.length > 0
        ? [
            { texto: " e " },
            {
              texto: `${atencao.length} ${atencao.length === 1 ? "licença vencendo" : "licenças vencendo"}`,
              destaque: true,
            },
          ]
        : []),
      { texto: ". Por onde quer começar?" },
    ],
  });
}

export async function perguntar(pergunta: string): Promise<void> {
  const texto = pergunta.trim();
  if (!texto || conversa.obter().pensando) return;
  adicionar({ autor: "usuario", trechos: [{ texto }] });
  definirPensando(true);
  try {
    const [resposta] = await Promise.all([montarResposta(texto), aguardar(700)]);
    adicionar({ autor: "assistente", ...resposta });
  } catch {
    adicionar({
      autor: "assistente",
      trechos: [{ texto: "Não consegui consultar os dados agora. Tente de novo em instantes." }],
    });
  } finally {
    definirPensando(false);
  }
}
