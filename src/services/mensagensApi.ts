import type { ProblemaApi } from "../types/api";

/**
 * Traduz os erros da volta-api (ProblemDetail em inglês) para mensagens que a
 * pessoa usuária entende. Quem exibe o erro não conhece códigos HTTP.
 */

const DETALHES_CONHECIDOS: Readonly<Record<string, string>> = {
  "Invalid credentials": "E-mail ou senha inválidos.",
  "You do not have permission to access this resource":
    "Você não tem permissão para esta ação.",
  "Incident is already closed": "Esta ocorrência já foi encerrada.",
  "Incident has an active collection and will be closed when it is completed":
    "Esta ocorrência tem uma coleta ativa e será encerrada quando a coleta terminar.",
  "Hazardous waste incidents can only be closed after a completed collection":
    "Resíduos perigosos só podem ser encerrados depois de uma coleta concluída.",
  "Internal Error":
    "O servidor da VOLTA teve um problema. Tente novamente em instantes.",
};

export const MENSAGEM_SEM_CONEXAO =
  "Não foi possível falar com o servidor da VOLTA. Confira sua conexão e tente novamente.";

export const MENSAGEM_TEMPO_ESGOTADO =
  "O servidor da VOLTA demorou para responder. Tente novamente em instantes.";

export function traduzirErro(
  status: number,
  problema: ProblemaApi | null,
  autenticada: boolean,
): string {
  const detalhe = problema?.detail?.trim();
  if (detalhe && DETALHES_CONHECIDOS[detalhe]) {
    return DETALHES_CONHECIDOS[detalhe];
  }

  switch (status) {
    case 400:
      return "Verifique os dados informados e tente de novo.";
    case 401:
      return autenticada
        ? "Sua sessão expirou. Entre novamente."
        : "E-mail ou senha inválidos.";
    case 403:
      return "Você não tem permissão para esta ação.";
    case 404:
      return "Não encontramos o que você procurou.";
    case 409:
      return "Esta operação conflita com dados já existentes.";
    case 422:
      return "A operação foi recusada por uma regra de negócio.";
    case 502:
    case 503:
    case 504:
      return "O servidor da VOLTA está indisponível no momento. Tente novamente em instantes.";
    default:
      return status >= 500
        ? "O servidor da VOLTA teve um problema. Tente novamente em instantes."
        : "Não foi possível concluir a operação.";
  }
}
