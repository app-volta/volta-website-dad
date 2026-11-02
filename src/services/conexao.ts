/** Quanto tempo esperar a página responder antes de dar a internet como fora. */
const TEMPO_LIMITE_MS = 5000;

/**
 * Confirma de verdade se há internet, pedindo a própria página: o navegador às
 * vezes diz "offline" com a rede de volta. Nunca rejeita; devolve falso se a página
 * não respondeu a tempo.
 */
export async function confirmarConexao(): Promise<boolean> {
  try {
    await fetch("/", {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
    return true;
  } catch {
    return false;
  }
}
