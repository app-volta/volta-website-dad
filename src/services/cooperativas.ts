import type { Cooperativa } from "../types/cooperativa";
import { aguardar } from "./http";

const CATALOGO: readonly Cooperativa[] = [
  {
    id: "coop-1",
    nome: "CooperAmbiental",
    cidade: "Lins",
    estado: "SP",
    materiaisAceitos: ["papelao", "plastico"],
    telefone: "(14) 3522-1200",
    distanciaKm: 4.2,
    avaliacao: 4.7,
  },
  {
    id: "coop-2",
    nome: "Recicla+ Pátio Vivo",
    cidade: "Bauru",
    estado: "SP",
    materiaisAceitos: ["plastico", "vidro"],
    telefone: "(14) 3235-4400",
    distanciaKm: 21.6,
    avaliacao: 4.5,
  },
  {
    id: "coop-3",
    nome: "Reciclamex Metais",
    cidade: "Araçatuba",
    estado: "SP",
    materiaisAceitos: ["metal"],
    telefone: "(18) 3627-8890",
    distanciaKm: 58.1,
    avaliacao: 4.9,
  },
  {
    id: "coop-4",
    nome: "Vidros do Cerrado",
    cidade: "Campo Grande",
    estado: "MS",
    materiaisAceitos: ["vidro"],
    telefone: "(67) 3325-9911",
    distanciaKm: 210.0,
    avaliacao: 4.4,
  },
];

export async function listarCooperativas(
  sinal?: AbortSignal,
): Promise<readonly Cooperativa[]> {
  await aguardar(450, sinal);
  return CATALOGO;
}

export async function obterCooperativa(
  id: string,
  sinal?: AbortSignal,
): Promise<Cooperativa> {
  await aguardar(350, sinal);
  const encontrada = CATALOGO.find((item) => item.id === id);
  if (!encontrada) {
    throw new Error(`Cooperativa ${id} não encontrada.`);
  }
  return encontrada;
}
