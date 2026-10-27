import type {
  Configuracoes,
  ParcialConfiguracoes,
} from "../types/configuracao";

export const META_MINIMA_KG = 100;
export const META_MAXIMA_KG = 1_000_000;

/** Aplica a alteração sobre as configurações sem perder o que não mudou. */
export function mesclarConfiguracoes(
  atual: Configuracoes,
  parcial: ParcialConfiguracoes,
): Configuracoes {
  return {
    ...atual,
    metaRecuperacaoKg: parcial.metaRecuperacaoKg ?? atual.metaRecuperacaoKg,
    insights: parcial.insights ?? atual.insights,
    notificacoes: { ...atual.notificacoes, ...parcial.notificacoes },
  };
}

/** Meta inteira entre o mínimo e o máximo; devolve a mensagem de erro ou nulo. */
export function validarMeta(valor: number): string | null {
  if (!Number.isInteger(valor)) return "Informe a meta em quilos, só com números.";
  if (valor < META_MINIMA_KG || valor > META_MAXIMA_KG) {
    return `A meta deve ficar entre ${META_MINIMA_KG.toLocaleString("pt-BR")} e ${META_MAXIMA_KG.toLocaleString("pt-BR")} kg por mês.`;
  }
  return null;
}

/** Percentual da meta já atingido, de 0 a 100 na barra e sem limite no texto. */
export function percentualDaMeta(recuperadoKg: number, metaKg: number): number {
  if (metaKg <= 0) return 0;
  return Math.round((recuperadoKg / metaKg) * 100);
}

/** Só os dígitos de um campo numérico, para a pessoa digitar "1.500" ou "1500". */
export function lerQuilos(texto: string): number {
  const digitos = texto.replace(/\D/g, "");
  return digitos === "" ? Number.NaN : Number(digitos);
}
