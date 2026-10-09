import type { MembroEquipe, PapelEquipe } from "../types/equipe";
import { validarEmail } from "./validadores";

export const ROTULOS_PAPEL: Readonly<Record<PapelEquipe, string>> = {
  colaborador: "Colaborador",
  responsavel_tecnico: "Responsável técnico",
  gestor: "Gestor",
};

export const DESCRICOES_PAPEL: Readonly<Record<PapelEquipe, string>> = {
  colaborador: "Registra ocorrências pelo app",
  responsavel_tecnico: "Revisa, encaminha e aprova",
  gestor: "Tudo + cooperativas, metas e equipe",
};

const MS_POR_MINUTO = 60 * 1000;

function inicioDoDia(data: Date): number {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime();
}

/** "agora", "há 12 min", "há 2 h", "ontem" ou "há 3 dias". */
export function formatarAtividade(iso: string, agora: Date = new Date()): string {
  const data = new Date(iso);
  const minutos = Math.floor((agora.getTime() - data.getTime()) / MS_POR_MINUTO);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const dias = Math.round((inicioDoDia(agora) - inicioDoDia(data)) / (24 * 60 * MS_POR_MINUTO));
  if (dias === 0) return `há ${Math.floor(minutos / 60)} h`;
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

/** Deriva um nome legível da parte local do e-mail: "joana.silva@x" vira "Joana Silva". */
export function nomeDoEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((parte) => parte[0].toUpperCase() + parte.slice(1).toLowerCase())
    .join(" ");
}

export interface ResumoEquipe {
  readonly pessoas: number;
  readonly responsaveisTecnicos: number;
  readonly registrosNoMes: number;
  readonly convitesPendentes: number;
}

export function resumirEquipe(equipe: readonly MembroEquipe[]): ResumoEquipe {
  return {
    pessoas: equipe.length,
    responsaveisTecnicos: equipe.filter((m) => m.papel === "responsavel_tecnico").length,
    registrosNoMes: equipe.reduce((soma, m) => soma + m.registrosNoMes, 0),
    convitesPendentes: equipe.filter((m) => m.convitePendente).length,
  };
}

export function textoBuscavel(membro: MembroEquipe): string {
  return [membro.nome, membro.email, membro.setor ?? "", ROTULOS_PAPEL[membro.papel]]
    .join(" ")
    .toLowerCase();
}

/** Valida o e-mail de um convite; reaproveita a regra de formato do login. */
export function validarEmailConvite(valor: string): string | null {
  if (!valor.trim()) return "Informe o e-mail da pessoa.";
  return validarEmail(valor);
}
