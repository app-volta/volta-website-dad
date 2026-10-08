import type { Notificacao } from "../types/notificacao";
import { criarArmazem } from "../utils/armazem";

/**
 * MOCK: substitua por chamada real quando o backend expuser /notificacoes.
 * As notificações são montadas aqui; o que o backend guardará de verdade é
 * quais já foram lidas, e isso vive em memória durante a sessão.
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

export function montarNotificacoes(
  idsLidos: ReadonlySet<string>,
  pendentes: number,
): readonly Notificacao[] {
  return MODELOS.map((modelo) => ({
    ...modelo,
    trechos: modelo.trechos(pendentes),
    lida: idsLidos.has(modelo.id),
  }));
}

export function marcarComoLida(id: string): void {
  if (lidas.obter().has(id)) return;
  lidas.definir(new Set([...lidas.obter(), id]));
}

export function marcarTodasComoLidas(): void {
  lidas.definir(new Set(MODELOS.map((modelo) => modelo.id)));
}
