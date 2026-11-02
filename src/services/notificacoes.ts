import type { Notificacao } from "../types/notificacao";
import type { Ocorrencia } from "../types/ocorrencia";
import { criarArmazem } from "../utils/armazem";
import { chaveDoDia, chaveDoMes } from "../utils/metas";
import type { AvisosCalculados } from "../utils/metas";
import { calcularPainel, tempoRelativo } from "../utils/painel";
import { notificacaoDaApi } from "./adaptadores";
import { USAR_MOCKS } from "./http";
import {
  marcarNotificacaoDaApiComoLida,
  marcarNotificacoesDaApiComoLidas,
} from "./notificacoesApi";
import type { NotificacoesDaApi } from "./notificacoesApi";

/**
 * No mock, as notificações vêm de modelos fixos. Com a API, vêm de
 * GET /notifications (ocorrência registrada, aprovada ou recusada e mudanças da
 * coleta); enquanto a rota não existe ou não responde, são montadas das
 * ocorrências já carregadas (últimos registros e fila de aprovação). Em todo caso,
 * o aviso da meta do mês e os avisos de Metas são montados aqui, porque a API não
 * os tem. Quais já foram lidas vive em memória durante a sessão.
 */

/** Quantas notificações da API o sino mostra: a lista cresce e o painel é pequeno. */
const LIMITE_DA_API = 20;

type ModeloNotificacao = Omit<Notificacao, "lida" | "trechos"> & {
  readonly trechos: (pendentes: number) => Notificacao["trechos"];
};

const MODELOS: readonly ModeloNotificacao[] = [
  {
    id: "aprovacao-0481",
    tipo: "aprovacao",
    trechos: () => [
      { texto: "Ana Souza", destaque: true },
      { texto: " aprovou a ocorrência #0481" },
    ],
    quando: "há 5 min",
    destino: "/ocorrencias/occ-0481",
  },
  {
    id: "licenca-recicla-vida",
    tipo: "licenca",
    trechos: () => [
      { texto: "Licença da " },
      { texto: "Recicla Vida", destaque: true },
      { texto: " vence em 12 dias" },
    ],
    quando: "há 1 h",
    destino: "/cooperativas",
  },
  {
    id: "fila-aguardando",
    tipo: "fila",
    trechos: (pendentes) => [
      {
        texto: `${pendentes} ${pendentes === 1 ? "ocorrência" : "ocorrências"}`,
        destaque: true,
      },
      { texto: " aguardando sua aprovação" },
    ],
    quando: "há 2 h",
    destino: "/ocorrencias",
  },
  {
    id: "meta-mes",
    tipo: "meta",
    trechos: () => [
      { texto: "A unidade bateu " },
      { texto: "76% da meta", destaque: true },
      { texto: " do mês" },
    ],
    quando: "ontem",
    destino: "/relatorios",
  },
];

/** A notificação da meta já vem lida; as outras três chegam como novas. */
const lidas = criarArmazem<ReadonlySet<string>>(new Set(["meta-mes"]));

export const assinarNotificacoes = lidas.assinar;
export const lerNotificacoesLidas = lidas.obter;

const EVENTOS_NOTIFICAVEIS: ReadonlySet<string> = new Set([
  "registro",
  "aprovacao",
  "recusa",
]);
const LIMITE_EVENTOS = 2;

/** O quanto da meta do mês já foi atingido; a API não calcula isso. */
function notificacaoDaMetaDoMes(
  idsLidos: ReadonlySet<string>,
  ocorrencias: readonly Ocorrencia[],
  metaKg: number,
): Notificacao | null {
  const recuperado = calcularPainel(ocorrencias, metaKg).recuperadoMesKg;
  if (recuperado <= 0 || metaKg <= 0) return null;
  return {
    id: "meta-mes",
    tipo: "meta",
    trechos: [
      { texto: "A unidade bateu " },
      { texto: `${Math.round((recuperado / metaKg) * 100)}% da meta`, destaque: true },
      { texto: " do mês" },
    ],
    quando: "este mês",
    destino: "/relatorios",
    lida: idsLidos.has("meta-mes"),
  };
}

/** Montadas das ocorrências já carregadas, para quando a API não devolve notificações. */
function notificacoesDasOcorrencias(
  idsLidos: ReadonlySet<string>,
  pendentes: number,
  ocorrencias: readonly Ocorrencia[],
  metaKg: number,
  podeRevisar: boolean,
): readonly Notificacao[] {
  const eventos = ocorrencias
    .flatMap((o) =>
      o.historico
        .filter((evento) => EVENTOS_NOTIFICAVEIS.has(evento.tipo))
        .map((evento) => ({ o, evento })),
    )
    .sort((a, b) => b.evento.em.localeCompare(a.evento.em))
    .slice(0, LIMITE_EVENTOS);

  const lista: Notificacao[] = eventos.map(({ o, evento }) => ({
    id: `evento-${o.id}-${evento.id}`,
    tipo: evento.tipo === "aprovacao" ? "aprovacao" : "fila",
    trechos: [
      { texto: evento.autor, destaque: true },
      { texto: ` ${evento.texto.split(" · ")[0]} ${o.codigo}` },
    ],
    quando: tempoRelativo(evento.em),
    destino: `/ocorrencias/${o.id}`,
    lida: idsLidos.has(`evento-${o.id}-${evento.id}`),
  }));

  if (pendentes > 0) {
    const maisRecente = ocorrencias
      .filter(
        (o) => o.status === "classificada" || o.status === "aguardando_classificacao",
      )
      .reduce((ultima, o) => (o.criadaEm > ultima ? o.criadaEm : ultima), "");
    lista.push({
      id: "fila-aguardando",
      tipo: "fila",
      trechos: [
        {
          texto: `${pendentes} ${pendentes === 1 ? "ocorrência" : "ocorrências"}`,
          destaque: true,
        },
        { texto: podeRevisar ? " aguardando sua aprovação" : " aguardando aprovação do gestor" },
      ],
      quando: tempoRelativo(maisRecente),
      destino: "/ocorrencias",
      lida: idsLidos.has("fila-aguardando"),
    });
  }

  const daMeta = notificacaoDaMetaDoMes(idsLidos, ocorrencias, metaKg);
  return daMeta ? [...lista, daMeta] : lista;
}

function notificacoesDaFonte(
  idsLidos: ReadonlySet<string>,
  pendentes: number,
  ocorrencias: readonly Ocorrencia[],
  metaKg: number,
  podeRevisar: boolean,
  daApi: NotificacoesDaApi,
  agora: Date,
): readonly Notificacao[] {
  if (!USAR_MOCKS) {
    if (daApi === "indisponivel") {
      return notificacoesDasOcorrencias(idsLidos, pendentes, ocorrencias, metaKg, podeRevisar);
    }
    // Enquanto a primeira resposta não chega, só o que a API não tem aparece; assim o sino não pisca.
    const daMeta = notificacaoDaMetaDoMes(idsLidos, ocorrencias, metaKg);
    const recebidas = (daApi ?? []).slice(0, LIMITE_DA_API).map((item) => {
      const notificacao = notificacaoDaApi(item, agora.getTime());
      return { ...notificacao, lida: notificacao.lida || idsLidos.has(notificacao.id) };
    });
    return daMeta ? [...recebidas, daMeta] : recebidas;
  }
  return MODELOS.filter(
    // Sem nada para aprovar, o aviso da fila perde o sentido.
    (modelo) => modelo.id !== "fila-aguardando" || pendentes > 0,
  ).map((modelo) => ({
    ...modelo,
    trechos: modelo.trechos(pendentes),
    lida: idsLidos.has(modelo.id),
  }));
}

/** Os avisos da meta que a pessoa ligou em Metas do mês e do dia. */
function notificacoesDaMeta(
  avisos: AvisosCalculados,
  idsLidos: ReadonlySet<string>,
  agora: Date,
): readonly Notificacao[] {
  const lista: Notificacao[] = [];
  if (avisos.metaDoDiaBatida) {
    const id = `meta-dia-${chaveDoDia(agora)}`;
    const { hojeKg, metaDoDiaKg } = avisos.metaDoDiaBatida;
    lista.push({
      id,
      tipo: "meta",
      trechos: [
        { texto: "A unidade bateu a " },
        { texto: "meta de hoje", destaque: true },
        { texto: ` · ${hojeKg.toLocaleString("pt-BR")} de ${metaDoDiaKg.toLocaleString("pt-BR")} kg` },
      ],
      quando: "hoje",
      destino: "/relatorios/metas",
      lida: idsLidos.has(id),
    });
  }
  if (avisos.foraDoRitmo) {
    const id = `meta-ritmo-${chaveDoMes(agora)}`;
    lista.push({
      id,
      tipo: "meta",
      trechos: [
        { texto: "O mês saiu do ritmo: " },
        { texto: `${avisos.foraDoRitmo.atingidoPct}% da meta`, destaque: true },
        { texto: ` com ${avisos.foraDoRitmo.esperadoPct}% dos dias passados` },
      ],
      quando: "este mês",
      destino: "/relatorios/metas",
      lida: idsLidos.has(id),
    });
  }
  return lista;
}

export function montarNotificacoes(
  idsLidos: ReadonlySet<string>,
  pendentes: number,
  ocorrencias: readonly Ocorrencia[],
  metaKg: number,
  podeRevisar: boolean,
  avisosDaMeta: AvisosCalculados,
  agora: Date = new Date(),
  daApi: NotificacoesDaApi = "indisponivel",
): readonly Notificacao[] {
  return [
    ...notificacoesDaFonte(idsLidos, pendentes, ocorrencias, metaKg, podeRevisar, daApi, agora),
    ...notificacoesDaMeta(avisosDaMeta, idsLidos, agora),
  ];
}

export function marcarComoLida(id: string): void {
  marcarNotificacaoDaApiComoLida(id);
  if (lidas.obter().has(id)) return;
  lidas.definir(new Set([...lidas.obter(), id]));
}

export function marcarTodasComoLidas(ids: readonly string[]): void {
  marcarNotificacoesDaApiComoLidas();
  lidas.definir(new Set([...lidas.obter(), ...ids]));
}
