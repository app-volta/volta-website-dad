import type {
  NivelContaminacao,
  OpcaoTipoResiduo,
} from "../../types/classificacao";
import { METADADOS_MATERIAL } from "../../types/material";
import { PRIORIDADES } from "./constantes";
import type { EstadoRegistrar } from "./reducer";

/** O que as partes da tela precisam saber do estado, calculado num lugar só. */
export interface DerivadosDoRegistro {
  readonly emAnalise: boolean;
  /** A IA respondeu (ou a pessoa preencheu sem ela): há o que conferir e registrar. */
  readonly concluida: boolean;
  readonly analiseFalhou: boolean;
  readonly analisando: boolean;
  /** Passo da barra de progresso: 1 nos detalhes, 2 na análise. */
  readonly passo: 1 | 2;
  readonly rotuloPrioridade: string;
  readonly tipoRotulo: string;
  readonly unidades: number | null;
  /** Id do tipo de resíduo escolhido; vazio enquanto não há um. */
  readonly valorDoTipo: string;
  readonly nivelDeContaminacao: NivelContaminacao | "";
  /** A área da foto fica com o aviso de erro: sem foto, e ela foi recusada ou falta. */
  readonly fotoComErro: boolean;
}

export function derivarDoRegistro(
  estado: EstadoRegistrar,
  opcoesDeTipo: readonly OpcaoTipoResiduo[],
): DerivadosDoRegistro {
  const emAnalise = estado.etapa === "analise";
  const concluida = emAnalise && estado.classificacao !== null;
  const analiseFalhou = emAnalise && estado.analiseFalhou;
  const analisando = emAnalise && estado.classificacao === null && !analiseFalhou;
  const materialRotulo = estado.classificacao?.material
    ? METADADOS_MATERIAL[estado.classificacao.material].rotulo
    : "";
  return {
    emAnalise,
    concluida,
    analiseFalhou,
    analisando,
    passo: estado.etapa === "detalhes" ? 1 : 2,
    rotuloPrioridade:
      PRIORIDADES.find((p) => p.valor === estado.prioridade)?.rotulo ?? "",
    tipoRotulo: estado.classificacao?.tipoDetectado ?? materialRotulo,
    unidades: estado.classificacao?.unidades ?? null,
    valorDoTipo:
      estado.classificacao?.tipoResiduoId ??
      opcoesDeTipo.find(
        (item) =>
          item.material !== null && item.material === estado.classificacao?.material,
      )?.valor ??
      "",
    nivelDeContaminacao: estado.classificacao?.contaminacao ?? "",
    fotoComErro:
      !estado.fotoBase64 && (estado.fotoRecusada || Boolean(estado.erroCampo.foto)),
  };
}
