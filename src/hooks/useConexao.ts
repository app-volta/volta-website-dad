import { useSyncExternalStore } from "react";

/**
 * Estado da conexão com a internet, compartilhado entre as telas. Segue os eventos
 * online/offline do navegador; "Tentar de novo" confirma de verdade, pedindo a
 * própria página (o navegador às vezes diz "offline" com a rede de volta).
 */
interface EstadoConexao {
  readonly online: boolean;
  readonly verificando: boolean;
}

const TEMPO_LIMITE_MS = 5000;

let estado: EstadoConexao = {
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  verificando: false,
};
const ouvintes = new Set<() => void>();

function atualizar(parcial: Partial<EstadoConexao>): void {
  const novo = { ...estado, ...parcial };
  if (novo.online === estado.online && novo.verificando === estado.verificando) return;
  estado = novo;
  for (const ouvinte of ouvintes) ouvinte();
}

function assinar(ouvinte: () => void): () => void {
  const aoVoltar = (): void => atualizar({ online: true });
  const aoCair = (): void => atualizar({ online: false });
  ouvintes.add(ouvinte);
  window.addEventListener("online", aoVoltar);
  window.addEventListener("offline", aoCair);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener("online", aoVoltar);
    window.removeEventListener("offline", aoCair);
  };
}

async function verificar(): Promise<void> {
  atualizar({ verificando: true });
  try {
    await fetch("/", {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
    atualizar({ online: true, verificando: false });
  } catch {
    atualizar({ online: false, verificando: false });
  }
}

interface UsoDaConexao extends EstadoConexao {
  readonly verificar: () => Promise<void>;
}

export function useConexao(): UsoDaConexao {
  const atual = useSyncExternalStore(
    assinar,
    () => estado,
    () => estado,
  );
  return { ...atual, verificar };
}
