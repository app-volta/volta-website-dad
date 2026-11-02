/**
 * Wrapper simples do localStorage (e do sessionStorage) com versionamento
 * explícito. Ao carregar, se a versão salva não bater com a esperada, o valor é
 * descartado — evita quebrar a aplicação quando o formato mudar entre releases.
 */

export interface EnvelopeArmazenado<T> {
  readonly _versao: number;
  readonly dados: T;
}

/**
 * Onde o valor fica: "local" sobrevive ao fechamento do navegador; "sessao" some
 * quando a aba fecha. Quase tudo usa "local"; a sessão sem "Manter conectado" usa "sessao".
 */
export type Armazenamento = "local" | "sessao";

function guardiao(onde: Armazenamento): Storage {
  return onde === "local" ? localStorage : sessionStorage;
}

export function salvar<T>(
  chave: string,
  versao: number,
  dados: T,
  onde: Armazenamento = "local",
): void {
  try {
    const envelope: EnvelopeArmazenado<T> = { _versao: versao, dados };
    guardiao(onde).setItem(chave, JSON.stringify(envelope));
  } catch {
    // Armazenamento indisponível — silenciar, não bloquear a UI.
  }
}

export function carregar<T>(
  chave: string,
  versaoEsperada: number,
  onde: Armazenamento = "local",
): T | null {
  try {
    const bruto = guardiao(onde).getItem(chave);
    if (!bruto) return null;
    const envelope = JSON.parse(bruto) as EnvelopeArmazenado<T>;
    if (
      typeof envelope !== "object" ||
      envelope === null ||
      envelope._versao !== versaoEsperada
    ) {
      guardiao(onde).removeItem(chave);
      return null;
    }
    return envelope.dados;
  } catch {
    return null;
  }
}

export function remover(chave: string, onde: Armazenamento = "local"): void {
  try {
    guardiao(onde).removeItem(chave);
  } catch {
    // silenciar
  }
}
