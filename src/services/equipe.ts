import type { MembroEquipe, NovoConvite } from "../types/equipe";
import { nomeDoEmail, validarEmailConvite } from "../utils/equipe";
import { aguardar } from "./http";

/**
 * MOCK: substitua por chamada real quando o backend expuser /equipe.
 * A equipe vive em memória; recarregar a página volta ao estado inicial.
 */

/** Data e hora de N minutos atrás, para o "última atividade" ficar sempre atual. */
function minutosAtras(minutos: number): string {
  return new Date(Date.now() - minutos * 60 * 1000).toISOString();
}

/** Ontem às 16h, para a coluna mostrar "ontem" em qualquer horário. */
function ontemAsDezesseis(): string {
  const data = new Date();
  data.setDate(data.getDate() - 1);
  data.setHours(16, 0, 0, 0);
  return data.toISOString();
}

const equipe: MembroEquipe[] = [
  {
    id: "membro-breno",
    nome: "Breno Gomes",
    email: "breno.santos@empresa.com.br",
    papel: "gestor",
    setor: "Frigorífico B2",
    registrosNoMes: 12,
    ultimaAtividade: minutosAtras(0),
    convitePendente: false,
  },
  {
    id: "membro-ana",
    nome: "Ana Souza",
    email: "ana.souza@empresa.com.br",
    papel: "responsavel_tecnico",
    setor: "Qualidade",
    registrosNoMes: 8,
    ultimaAtividade: minutosAtras(12),
    convitePendente: false,
  },
  {
    id: "membro-carla",
    nome: "Carla Mendes",
    email: "carla.mendes@empresa.com.br",
    papel: "responsavel_tecnico",
    setor: "Expedição",
    registrosNoMes: 15,
    ultimaAtividade: minutosAtras(40),
    convitePendente: false,
  },
  {
    id: "membro-joao",
    nome: "João Pereira",
    email: "joao.pereira@empresa.com.br",
    papel: "colaborador",
    setor: "Manutenção",
    registrosNoMes: 9,
    ultimaAtividade: minutosAtras(125),
    convitePendente: false,
  },
  {
    id: "membro-rafael",
    nome: "Rafael Lima",
    email: "rafael.lima@empresa.com.br",
    papel: "colaborador",
    setor: "Refeitório",
    registrosNoMes: 6,
    ultimaAtividade: ontemAsDezesseis(),
    convitePendente: false,
  },
  {
    id: "membro-priscila",
    nome: "Priscila Nunes",
    email: "priscila.nunes@empresa.com.br",
    papel: "colaborador",
    setor: "Frigorífico B2",
    registrosNoMes: 2,
    ultimaAtividade: null,
    convitePendente: true,
  },
];

export async function listarEquipe(
  sinal?: AbortSignal,
): Promise<readonly MembroEquipe[]> {
  await aguardar(450, sinal);
  return [...equipe];
}

export async function convidarPessoa(
  convite: NovoConvite,
  sinal?: AbortSignal,
): Promise<MembroEquipe> {
  await aguardar(800, sinal);

  const erroEmail = validarEmailConvite(convite.email);
  if (erroEmail) throw new Error(erroEmail);
  const email = convite.email.trim().toLowerCase();
  if (equipe.some((m) => m.email.toLowerCase() === email)) {
    throw new Error("Essa pessoa já está na equipe ou já foi convidada.");
  }

  const novo: MembroEquipe = {
    id: `membro-${Date.now()}`,
    nome: nomeDoEmail(email),
    email,
    papel: convite.papel,
    setor: null,
    registrosNoMes: 0,
    ultimaAtividade: null,
    convitePendente: true,
  };
  equipe.push(novo);
  return novo;
}

/** Reenvia o convite: no mock só confirma, já que não há e-mail de verdade. */
export async function reenviarConvite(
  id: string,
  sinal?: AbortSignal,
): Promise<void> {
  await aguardar(500, sinal);
  const membro = equipe.find((m) => m.id === id);
  if (!membro?.convitePendente) throw new Error("Não há convite pendente para reenviar.");
}

export async function cancelarConvite(
  id: string,
  sinal?: AbortSignal,
): Promise<void> {
  await aguardar(500, sinal);
  const indice = equipe.findIndex((m) => m.id === id && m.convitePendente);
  if (indice < 0) throw new Error("Não há convite pendente para cancelar.");
  equipe.splice(indice, 1);
}
