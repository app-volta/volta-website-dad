import { useMemo } from "react";

import { useMetaRecuperacao } from "./useMeta";
import {
  PAINEL_COM_DADOS_REAIS,
  contarRegistradasPor,
  montarPainel,
} from "../services/painel";
import type { Ocorrencia } from "../types/ocorrencia";
import type { AtividadeEquipe, PainelInicio } from "../types/painel";
import { atividadesDaPessoa } from "../utils/painel";

/** Quantas ocorrências a pessoa registrou. */
export function useRegistradasPor(
  ocorrencias: readonly Ocorrencia[] | null,
  usuarioId: string,
): number {
  return useMemo(
    () => contarRegistradasPor(ocorrencias ?? [], usuarioId),
    [ocorrencias, usuarioId],
  );
}

/** O que a pessoa fez nas ocorrências, da mais recente para a mais antiga. */
export function useMinhasAtividades(
  ocorrencias: readonly Ocorrencia[] | null,
  nome: string,
): readonly AtividadeEquipe[] {
  return useMemo(
    () => atividadesDaPessoa(ocorrencias ?? [], nome),
    [ocorrencias, nome],
  );
}

interface EstadoPainel {
  readonly painel: PainelInicio;
  /** Os números vêm da API (podem estar zerados) e não do protótipo. */
  readonly dadosReais: boolean;
}

/** Números do Início para a lista de ocorrências já carregada (nula enquanto carrega). */
export function usePainel(
  ocorrencias: readonly Ocorrencia[] | null,
): EstadoPainel {
  // A meta pode mudar em Configurações e chega da API depois da primeira tela.
  const metaKg = useMetaRecuperacao();
  const painel = useMemo(
    () => montarPainel(ocorrencias ?? [], metaKg),
    [ocorrencias, metaKg],
  );
  return { painel, dadosReais: PAINEL_COM_DADOS_REAIS };
}
