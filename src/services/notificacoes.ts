import type { Notificacao } from "../types/notificacao";
import type { Ocorrencia } from "../types/ocorrencia";
import { criarArmazem } from "../utils/armazem";
import { calcularPainel, tempoRelativo } from "../utils/painel";
import { USAR_MOCKS } from "./http";

/**
 * A volta-api não tem endpoint de notificações. No mock, elas vêm de modelos
 * fixos; com a API, são montadas das ocorrências já carregadas (últimos
 * registros, fila de aprovação e meta do mês). Quais já foram lidas vive em
 * memória durante a sessão.
 */

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

function notificacoesDaApi(
  idsLidos: ReadonlySet<string>,
  pendentes: number,
  ocorrencias: readonly Ocorrencia[],
  metaKg: number,
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
        { texto: " aguardando sua aprovação" },
      ],
      quando: tempoRelativo(maisRecente),
      destino: "/ocorrencias",
      lida: idsLidos.has("fila-aguardando"),
    });
  }

  const recuperado = calcularPainel(ocorrencias, metaKg).recuperadoMesKg;
  if (recuperado > 0 && metaKg > 0) {
    lista.push({
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
    });
  }
  return lista;
}

export function montarNotificacoes(
  idsLidos: ReadonlySet<string>,
  pendentes: number,
  ocorrencias: readonly Ocorrencia[],
  metaKg: number,
): readonly Notificacao[] {
  if (!USAR_MOCKS) {
    return notificacoesDaApi(idsLidos, pendentes, ocorrencias, metaKg);
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

export function marcarComoLida(id: string): void {
  if (lidas.obter().has(id)) return;
  lidas.definir(new Set([...lidas.obter(), id]));
}

export function marcarTodasComoLidas(ids: readonly string[]): void {
  lidas.definir(new Set([...lidas.obter(), ...ids]));
}
