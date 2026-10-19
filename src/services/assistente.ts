import type { MensagemAssistente } from "../types/assistente";
import type { Ocorrencia } from "../types/ocorrencia";
import { criarArmazem } from "../utils/armazem";
import { estadoLicenca, rotuloLicenca } from "../utils/cooperativas";
import { numeroCurto, normalizar } from "../utils/busca";
import { aguardaAprovacao, categoriaDe } from "../utils/statusOcorrencia";
import { conteudoDaRespostaChat } from "./adaptadores";
import { criarSessaoChat, perguntarAoChatbot } from "./chatbot";
import { listarCooperativas } from "./cooperativas";
import { aguardar, aoEncerrarSessao, ErroHttp, USAR_MOCKS } from "./http";
import { listarOcorrencias } from "./ocorrencias";

/**
 * Assistente VOLTA. Com VITE_USAR_MOCKS=false conversa com o volta-chatbot
 * (POST /v1/sessions e POST /v1/chat). Nos demais casos usa o mock: as
 * respostas saem dos mesmos dados das telas e só cobrem poucos assuntos por
 * palavra-chave; o resto cai numa resposta de ajuda.
 */

const SUGESTOES_MOCK: readonly string[] = [
  "O que está esperando aprovação?",
  "Resumo da semana",
  "Licenças vencendo",
];

const SUGESTOES_CHATBOT: readonly string[] = [
  "Como descartar óleo de cozinha?",
  "Quais normas valem para resíduo perigoso?",
  "Como está o desempenho da unidade?",
];

export const SUGESTOES_ASSISTENTE: readonly string[] = USAR_MOCKS
  ? SUGESTOES_MOCK
  : SUGESTOES_CHATBOT;

interface EstadoConversa {
  readonly mensagens: readonly MensagemAssistente[];
  readonly pensando: boolean;
}

const conversa = criarArmazem<EstadoConversa>({ mensagens: [], pensando: false });

export const assinarConversa = conversa.assinar;
export const lerConversa = conversa.obter;

/** Sessão do chatbot, criada na primeira pergunta e esquecida quando a pessoa sai. */
let sessaoChat: string | null = null;

aoEncerrarSessao(() => {
  sessaoChat = null;
  conversa.definir({ mensagens: [], pensando: false });
});

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

async function responderComChatbot(pergunta: string): Promise<RespostaAssistente> {
  sessaoChat ??= (await criarSessaoChat()).session_id;
  return conteudoDaRespostaChat(await perguntarAoChatbot(sessaoChat, pergunta));
}

function textoDeErro(excecao: unknown): string {
  if (!USAR_MOCKS && excecao instanceof ErroHttp) {
    // Sessão recusada ou inexistente: a próxima pergunta abre uma nova.
    if (excecao.status === 403 || excecao.status === 404) sessaoChat = null;
    return excecao.message;
  }
  return "Não consegui consultar os dados agora. Tente de novo em instantes.";
}

/** Primeira mensagem da conversa: um olhar rápido sobre a unidade. */
export async function iniciarConversa(): Promise<void> {
  if (conversa.obter().mensagens.length > 0) return;

  if (!USAR_MOCKS) {
    adicionar({
      autor: "assistente",
      trechos: [
        { texto: "Sou o assistente da VOLTA. Pergunte sobre " },
        { texto: "normas de descarte", destaque: true },
        { texto: ", " },
        { texto: "ocorrências", destaque: true },
        { texto: " ou o " },
        { texto: "desempenho da unidade", destaque: true },
        { texto: "." },
      ],
    });
    return;
  }

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
    const resposta = USAR_MOCKS
      ? (await Promise.all([montarResposta(texto), aguardar(700)]))[0]
      : await responderComChatbot(texto);
    adicionar({ autor: "assistente", ...resposta });
  } catch (excecao) {
    adicionar({ autor: "assistente", trechos: [{ texto: textoDeErro(excecao) }] });
  } finally {
    definirPensando(false);
  }
}
