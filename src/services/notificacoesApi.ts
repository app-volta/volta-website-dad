import type { NotificacaoApi } from "../types/api";
import { criarArmazem } from "../utils/armazem";
import { USAR_MOCKS, aoEncerrarSessao, requisitar } from "./http";

/**
 * Notificações da volta-api (GET /notifications, PATCH /notifications/{id}/read e
 * PATCH /notifications/read-all), as da pessoa logada. Vale `null` até a primeira
 * resposta e "indisponivel" quando a API não as tem ou não respondeu; nesse caso o
 * sino monta a lista das ocorrências, como antes da rota existir.
 */
export type NotificacoesDaApi = readonly NotificacaoApi[] | "indisponivel" | null;

/** Com que frequência a lista é buscada de novo: as notificações nascem de ações de outras pessoas. */
const INTERVALO_MS = 60_000;

const armazem = criarArmazem<NotificacoesDaApi>(null);

export const assinarNotificacoesDaApi = armazem.assinar;
export const lerNotificacoesDaApi = armazem.obter;

function listaAtual(): readonly NotificacaoApi[] | null {
  const estado = armazem.obter();
  return typeof estado === "object" && estado !== null ? estado : null;
}

export async function recarregarNotificacoesDaApi(sinal?: AbortSignal): Promise<void> {
  try {
    armazem.definir(await requisitar<readonly NotificacaoApi[]>("/notifications", { sinal }));
  } catch {
    if (sinal?.aborted) return;
    // Sem a rota (404) ou fora do ar: o sino usa as ocorrências. Uma lista que já chegou fica como está.
    if (armazem.obter() === null) armazem.definir("indisponivel");
  }
}

/**
 * Busca a lista agora e a cada minuto, parando quando a aba está escondida.
 * Devolve a função que para a busca. Com os mocks, não faz nada.
 */
export function acompanharNotificacoesDaApi(): () => void {
  if (USAR_MOCKS) return () => undefined;
  const controle = new AbortController();
  void recarregarNotificacoesDaApi(controle.signal);
  const relogio = window.setInterval(() => {
    if (!document.hidden) void recarregarNotificacoesDaApi(controle.signal);
  }, INTERVALO_MS);
  return () => {
    controle.abort();
    window.clearInterval(relogio);
  };
}

/** Marca uma como lida na hora e avisa a API; se ela falhar, a lista volta ao que o servidor tem. */
export function marcarNotificacaoDaApiComoLida(id: string): void {
  const alvo = listaAtual()?.find((item) => item.id === id);
  if (!alvo || alvo.read) return;
  armazem.definir(
    (listaAtual() ?? []).map((item) => (item.id === id ? { ...item, read: true } : item)),
  );
  requisitar<void>(`/notifications/${id}/read`, { metodo: "PATCH" }).catch(() =>
    recarregarNotificacoesDaApi(),
  );
}

/** Marca todas como lidas na hora e avisa a API, com o mesmo recuo em caso de falha. */
export function marcarNotificacoesDaApiComoLidas(): void {
  const lista = listaAtual();
  if (!lista?.some((item) => !item.read)) return;
  armazem.definir(lista.map((item) => ({ ...item, read: true })));
  requisitar<void>("/notifications/read-all", { metodo: "PATCH" }).catch(() =>
    recarregarNotificacoesDaApi(),
  );
}

/** Na saída ou na troca de pessoa, a lista da anterior não pode aparecer para a próxima. */
aoEncerrarSessao(() => armazem.definir(null));
