export type PapelUsuario = "responsavel_pgrs" | "operador";

export interface Usuario {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly papel: PapelUsuario;
  readonly unidade: string;
  /** Perfil de acesso na volta-api; define o que a API deixa a pessoa fazer. */
  readonly perfil?: "ADMIN" | "MANAGER" | "EMPLOYEE" | "OPERATOR";
  /** Empresa na volta-api; a lista de usuários da API vem de todas as empresas. */
  readonly empresaId?: string;
  /** Cargo informado no perfil (position na volta-api); a API aceita vazio. */
  readonly cargo?: string | null;
  readonly avatarUrl?: string;
}

export interface CredenciaisLogin {
  readonly email: string;
  readonly senha: string;
}

export interface DadosCadastro {
  readonly nome: string;
  readonly email: string;
  readonly senha: string;
  readonly papel: PapelUsuario;
  readonly unidade: string;
}

export interface SessaoAutenticada {
  readonly usuario: Usuario;
  readonly token: string;
  readonly expiraEm: string;
  /** O login pediu a troca da senha provisória: o painel só libera depois dela. */
  readonly primeiroAcesso?: boolean;
}
