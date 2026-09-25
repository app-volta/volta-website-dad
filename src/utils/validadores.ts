import type { ResultadoValidacao } from "../types/comum";

const REGEX_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export function validarEmail(valor: string): string | null {
  if (!valor.trim()) return "Informe seu e-mail.";
  if (valor.length > 120) return "E-mail muito longo.";
  if (!REGEX_EMAIL.test(valor)) return "E-mail em formato inválido.";
  return null;
}

export function validarSenha(valor: string): string | null {
  if (!valor) return "Informe sua senha.";
  if (valor.length < 6) return "Senha precisa de pelo menos 6 caracteres.";
  if (valor.length > 72) return "Senha muito longa (máx. 72).";
  return null;
}

export function validarObrigatorio(
  valor: string,
  rotulo: string,
  maximo = 200,
): string | null {
  const limpo = valor.trim();
  if (!limpo) return `Preencha ${rotulo}.`;
  if (limpo.length > maximo) {
    return `${rotulo} deve ter no máximo ${maximo} caracteres.`;
  }
  return null;
}

export function validarDescricao(valor: string): string | null {
  const limpo = valor.trim();
  if (!limpo) return "Descreva o resíduo encontrado.";
  if (limpo.length < 10) return "Descrição muito curta (mín. 10 caracteres).";
  if (limpo.length > 500) return "Descrição longa demais (máx. 500).";
  return null;
}

export function validarFoto(valor: string | null): string | null {
  if (!valor) return "Anexe uma foto do resíduo.";
  return null;
}

export function combinar(
  entradas: Readonly<Record<string, string | null>>,
): ResultadoValidacao {
  const erros: Record<string, string> = {};
  for (const chave of Object.keys(entradas)) {
    const mensagem = entradas[chave];
    if (mensagem) erros[chave] = mensagem;
  }
  return { valido: Object.keys(erros).length === 0, erros };
}
