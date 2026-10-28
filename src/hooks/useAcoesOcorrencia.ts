import {
  alterarClassificacao,
  analisarOcorrencia,
  aprovarOcorrencia,
  aprovarOcorrencias,
  criarOcorrencia,
  encaminharOcorrencia,
  recusarOcorrencia,
  registrarObservacao,
} from "../services/ocorrencias";

/** Ações sobre ocorrências. Telas e componentes chamam o hook, nunca o serviço direto. */
export interface AcoesOcorrencia {
  readonly analisar: typeof analisarOcorrencia;
  readonly criar: typeof criarOcorrencia;
  readonly aprovar: typeof aprovarOcorrencia;
  readonly aprovarVarias: typeof aprovarOcorrencias;
  readonly recusar: typeof recusarOcorrencia;
  readonly encaminhar: typeof encaminharOcorrencia;
  readonly observar: typeof registrarObservacao;
  readonly reclassificar: typeof alterarClassificacao;
}

const ACOES: AcoesOcorrencia = {
  analisar: analisarOcorrencia,
  criar: criarOcorrencia,
  aprovar: aprovarOcorrencia,
  aprovarVarias: aprovarOcorrencias,
  recusar: recusarOcorrencia,
  encaminhar: encaminharOcorrencia,
  observar: registrarObservacao,
  reclassificar: alterarClassificacao,
};

export function useAcoesOcorrencia(): AcoesOcorrencia {
  return ACOES;
}
