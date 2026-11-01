import {
  CODIGO_DA_DEMONSTRACAO,
  conferirCodigoDeSenha,
  pedirCodigoDeSenha,
  redefinirSenha,
  trocarSenha,
} from "../services/senha";
import { USAR_MOCKS } from "../services/http";

/** Ações de senha. Telas e componentes chamam o hook, nunca o serviço direto. */
export interface AcoesDeSenha {
  readonly pedirCodigo: typeof pedirCodigoDeSenha;
  readonly conferirCodigo: typeof conferirCodigoDeSenha;
  readonly redefinir: typeof redefinirSenha;
  readonly trocar: typeof trocarSenha;
  /** Só na demonstração (sem API, sem e-mail): o código que ela aceita. */
  readonly codigoDaDemonstracao: string | null;
}

const ACOES: AcoesDeSenha = {
  pedirCodigo: pedirCodigoDeSenha,
  conferirCodigo: conferirCodigoDeSenha,
  redefinir: redefinirSenha,
  trocar: trocarSenha,
  codigoDaDemonstracao: USAR_MOCKS ? CODIGO_DA_DEMONSTRACAO : null,
};

export function useAcoesDeSenha(): AcoesDeSenha {
  return ACOES;
}
