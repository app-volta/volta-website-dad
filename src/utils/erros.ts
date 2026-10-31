/**
 * O erro veio de uma resposta 401 da API (credenciais recusadas)? As páginas usam
 * isto para separar "e-mail ou senha incorretos" de uma falha de rede, sem importar
 * a camada de services.
 */
export function foiNaoAutorizado(excecao: unknown): boolean {
  return (
    typeof excecao === "object" &&
    excecao !== null &&
    "status" in excecao &&
    excecao.status === 401
  );
}
