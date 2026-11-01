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
 * O erro veio de uma resposta 403 (o perfil não pode ver aquilo)? A tela mostra
 * "acesso restrito" em vez de uma falha.
 */
export function foiProibido(excecao: unknown): boolean {
  return statusDe(excecao) === 403;
}
