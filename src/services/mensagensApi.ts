import type { ProblemaApi } from "../types/api";

/**
 * Traduz os erros da volta-api (ProblemDetail em inglês) para mensagens que a
 * pessoa usuária entende. Quem exibe o erro não conhece códigos HTTP.
 */

/** Respostas 422 que dizem que a ocorrência mudou desde que a pessoa a abriu. */
const DETALHES_DE_OCORRENCIA_DESATUALIZADA: ReadonlySet<string> = new Set([
  "Incident is already closed",
  "Only pending incidents can be approved",
  "Only pending incidents can be rejected",
  "Only pending incidents can be edited",
]);

const MENSAGEM_JA_NAO_AGUARDA = "Esta ocorrência já não está aguardando aprovação.";

/** A troca de senha usa esta mensagem para ligar o erro ao campo da senha atual. */
export const MENSAGEM_SENHA_ATUAL_INCORRETA = "A senha atual não confere.";

const DETALHES_CONHECIDOS: Readonly<Record<string, string>> = {
  "Invalid credentials": "E-mail ou senha inválidos.",
  "You do not have permission to access this resource":
    "Você não tem permissão para esta ação.",
  "Invalid or expired code": "O código não confere ou já venceu. Peça um novo.",
  "Current password is incorrect": MENSAGEM_SENHA_ATUAL_INCORRETA,
  "New password must be different from the current password":
    "A nova senha precisa ser diferente da atual.",
  "Incident is already closed": "Esta ocorrência já foi encerrada.",
  "Only pending incidents can be approved": MENSAGEM_JA_NAO_AGUARDA,
  "Only pending incidents can be rejected": MENSAGEM_JA_NAO_AGUARDA,
  "Only pending incidents can be edited": MENSAGEM_JA_NAO_AGUARDA,
  "Incident has an active collection and will be closed when it is completed":
    "Esta ocorrência tem uma coleta ativa e será encerrada quando a coleta terminar.",
  "Hazardous waste incidents can only be closed after a completed collection":
    "Resíduos perigosos só podem ser encerrados depois de uma coleta concluída.",
  "Register an ESG metric before setting a goal":
    "A empresa ainda não tem métricas ESG cadastradas, então a meta não pode ser salva por enquanto.",
  "CNPJ already registered": "Já existe um cadastro com esse CNPJ.",
  "Email already registered": "Já existe uma pessoa com esse e-mail.",
  "You cannot change your own role":
    "Você não pode alterar o seu próprio perfil de acesso.",
  "Company coordinates are not registered":
    "A empresa ainda não tem coordenadas cadastradas, então não dá para indicar cooperativas.",
  "Radioactive waste cannot be sent to cooperatives":
    "Resíduo radioativo não pode ser enviado a cooperativas.",
  "Internal Error":
    "O servidor da VOLTA teve um problema. Tente novamente em instantes.",
};

export const MENSAGEM_SEM_CONEXAO =
  "Não foi possível falar com o servidor da VOLTA. Confira sua conexão e tente novamente.";

export const MENSAGEM_TEMPO_ESGOTADO =
  "O servidor da VOLTA demorou para responder. Tente novamente em instantes.";

/** A resposta diz que outra pessoa já decidiu esta ocorrência? */
export function ocorrenciaDesatualizada(
  status: number,
  problema: ProblemaApi | null,
): boolean {
  const detalhe = problema?.detail?.trim();
  return (
    status === 422 &&
    detalhe !== undefined &&
    DETALHES_DE_OCORRENCIA_DESATUALIZADA.has(detalhe)
  );
}

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
