import type { Material } from "./material";

export interface Cooperativa {
  readonly id: string;
  readonly nome: string;
  readonly cidade: string;
  readonly estado: string;
  readonly materiaisAceitos: readonly Material[];
  readonly telefone: string;
  readonly distanciaKm: number;
  readonly avaliacao: number;
  readonly logoUrl?: string;
}
