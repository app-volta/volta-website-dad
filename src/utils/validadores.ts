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

const NOME_MINIMO = 3;

/** Nome de pessoa: obrigatório, até 80 caracteres e pelo menos 3 letras. */
export function validarNome(valor: string): string | null {
  const obrigatorio = validarObrigatorio(valor, "o nome", 80);
  if (obrigatorio) return obrigatorio;
  if (valor.trim().length < NOME_MINIMO) {
    return `O nome precisa de pelo menos ${NOME_MINIMO} letras.`;
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

/** Maior peso aceito em uma ocorrência, em kg. */
export const PESO_MAXIMO_KG = 100_000;

/** Lê o peso digitado com vírgula ou ponto como separador decimal; vazio ou inválido vira NaN. */
export function lerPeso(texto: string): number {
  const limpo = texto.trim().replace(",", ".");
  return limpo === "" ? Number.NaN : Number(limpo);
}

/** O peso é opcional: vazio vale; preenchido precisa ser maior que 0 e ir até 100.000 kg. */
export function validarPeso(texto: string): string | null {
  if (texto.trim() === "") return null;
  const kg = lerPeso(texto);
  if (!Number.isFinite(kg) || kg <= 0 || kg > PESO_MAXIMO_KG) {
    return "Informe um peso maior que 0 e até 100.000 kg, ou deixe em branco.";
  }
  return null;
}

const PESOS_CNPJ: readonly (readonly number[])[] = [
  [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
];

function digitosVerificadoresCnpj(base: readonly number[]): readonly number[] {
  const digitos = [...base];
  for (const pesos of PESOS_CNPJ) {
    const soma = pesos.reduce((total, peso, i) => total + peso * digitos[i], 0);
    const resto = soma % 11;
    digitos.push(resto < 2 ? 0 : 11 - resto);
  }
  return digitos.slice(12);
}

export function validarCnpj(valor: string): string | null {
  const digitos = valor.replace(/\D/g, "");
  if (!digitos) return "Informe o CNPJ.";
  if (digitos.length !== 14) return "O CNPJ tem 14 dígitos.";
  if (/^(\d)\1{13}$/.test(digitos)) return "CNPJ inválido.";
  const numeros = digitos.split("").map(Number);
  const esperados = digitosVerificadoresCnpj(numeros.slice(0, 12));
  if (esperados[0] !== numeros[12] || esperados[1] !== numeros[13]) {
    return "CNPJ inválido. Confira os números.";
  }
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
