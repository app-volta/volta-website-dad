export type PapelUsuario = "responsavel_pgrs" | "operador";

export interface Usuario {
  readonly id: string;
  readonly nome: string;
  readonly email: string;
  readonly papel: PapelUsuario;
  readonly unidade: string;
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
}
