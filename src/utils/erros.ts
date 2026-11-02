function statusDe(excecao: unknown): unknown {
  return typeof excecao === "object" && excecao !== null && "status" in excecao
    ? excecao.status
    : null;
}

/**
 * O erro veio de uma resposta 401 da API (credenciais recusadas)? As páginas usam
 * isto para separar "e-mail ou senha incorretos" de uma falha de rede, sem importar
 * a camada de services.
 */
export function foiNaoAutorizado(excecao: unknown): boolean {
  return statusDe(excecao) === 401;
}

/**
 * O serviço não respondeu: sem rede, tempo esgotado ou erro do servidor (5xx).
 * Tentar de novo pode resolver; um erro de regra (403, 422...) não.
 */
export function foiSemResposta(excecao: unknown): boolean {
  const status = statusDe(excecao);
  return typeof status === "number" && (status === 0 || status >= 500);
}

/**
 * A conexão caiu ou o tempo acabou sem resposta: o servidor pode ter recebido o
 * pedido, e a tela não tem como saber. Quem criou algo deve avisar antes de repetir.
 */
export function foiResultadoIncerto(excecao: unknown): boolean {
  return statusDe(excecao) === 0;
}

/** A API recusou por conflito (409): já existe um cadastro igual. */
export function foiConflito(excecao: unknown): boolean {
  return statusDe(excecao) === 409;
}

/**
 * Outra pessoa já aprovou, recusou ou encerrou a ocorrência enquanto ela estava
 * aberta, e a ação da pessoa não foi aplicada.
 */
export function foiOcorrenciaDesatualizada(excecao: unknown): boolean {
  return (
    typeof excecao === "object" &&
    excecao !== null &&
    "desatualizada" in excecao &&
    excecao.desatualizada === true
  );
}

/**
 * A mensagem que a API ligou a um campo do formulário (por exemplo `senhaAtual`),
 * ou `null` quando o erro não é de um campo.
 */
export function mensagemDoCampo(excecao: unknown, campo: string): string | null {
  if (typeof excecao !== "object" || excecao === null || !("campos" in excecao)) {
    return null;
  }
  const campos = excecao.campos;
  if (typeof campos !== "object" || campos === null) return null;
  const mensagem = (campos as Readonly<Record<string, unknown>>)[campo];
  return typeof mensagem === "string" ? mensagem : null;
}

/**
 * O erro veio de uma resposta 403 (o perfil não pode ver aquilo)? A tela mostra
 * "acesso restrito" em vez de uma falha.
 */
export function foiProibido(excecao: unknown): boolean {
  return statusDe(excecao) === 403;
}
