/** Menor e maior senha que a volta-api aceita. */
export const SENHA_MINIMA = 8;
export const SENHA_MAXIMA = 72;

export const DICA_DE_SENHA = "Use pelo menos 8 caracteres, com letras e números.";

export type NivelDaSenha = "fraca" | "media" | "forte";

export interface AvaliacaoDaSenha {
  /** De 0 a 4: quantas barras da medida de força ficam cheias. */
  readonly pontos: number;
  readonly nivel: NivelDaSenha;
  readonly rotulo: string;
}

const ROTULO_DO_NIVEL: Readonly<Record<NivelDaSenha, string>> = {
  fraca: "Fraca",
  media: "Média",
  forte: "Forte",
};

/** Mede a senha só para orientar quem digita; quem recusa de verdade é a validação. */
export function avaliarSenha(senha: string): AvaliacaoDaSenha {
  const temLetraENumero = /\p{L}/u.test(senha) && /\d/.test(senha);
  const temCaixaMista = /\p{Ll}/u.test(senha) && /\p{Lu}/u.test(senha);
  const temSimboloOuEhLonga = /[^\p{L}\d]/u.test(senha) || senha.length >= 12;

  let pontos = 0;
  if (senha.length >= SENHA_MINIMA) pontos += 1;
  if (temLetraENumero) pontos += 1;
  if (temCaixaMista) pontos += 1;
  if (temSimboloOuEhLonga) pontos += 1;
  // Curta demais, a senha não passa de fraca, por mais variada que seja.
  if (senha.length < SENHA_MINIMA) pontos = Math.min(pontos, 1);

  const nivel: NivelDaSenha = pontos <= 1 ? "fraca" : pontos >= 4 ? "forte" : "media";
  return { pontos, nivel, rotulo: ROTULO_DO_NIVEL[nivel] };
}

/** Senha nova: de 8 a 72 caracteres, com letras e números. */
export function validarNovaSenha(valor: string): string | null {
  if (!valor) return "Informe a nova senha.";
  if (valor.length > SENHA_MAXIMA) {
    return `A senha pode ter no máximo ${SENHA_MAXIMA} caracteres.`;
  }
  if (valor.length < SENHA_MINIMA || !/\p{L}/u.test(valor) || !/\d/.test(valor)) {
    return DICA_DE_SENHA;
  }
  return null;
}

export function validarConfirmacao(nova: string, confirmacao: string): string | null {
  if (!confirmacao) return "Confirme a nova senha.";
  return nova === confirmacao ? null : "As senhas não são iguais.";
}
