/**
 * Wrapper simples do localStorage com versionamento explícito. Ao carregar,
 * se a versão salva não bater com a esperada, o valor é descartado — evita
 * quebrar a aplicação quando o formato mudar entre releases.
 */

export interface EnvelopeArmazenado<T> {
  readonly _versao: number;
  readonly dados: T;
}

export function salvar<T>(chave: string, versao: number, dados: T): void {
  try {
    const envelope: EnvelopeArmazenado<T> = { _versao: versao, dados };
    localStorage.setItem(chave, JSON.stringify(envelope));
  } catch {
    // localStorage indisponível — silenciar, não bloquear a UI.
  }
}

export function carregar<T>(chave: string, versaoEsperada: number): T | null {
  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return null;
    const envelope = JSON.parse(bruto) as EnvelopeArmazenado<T>;
    if (
      typeof envelope !== "object" ||
      envelope === null ||
      envelope._versao !== versaoEsperada
    ) {
      localStorage.removeItem(chave);
      return null;
    }
    return envelope.dados;
  } catch {
    return null;
  }
}

export function remover(chave: string): void {
  try {
    localStorage.removeItem(chave);
  } catch {
    // silenciar
  }
}
