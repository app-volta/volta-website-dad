export interface UnidadeConfiguracao {
  readonly nome: string;
  readonly cnpj: string;
  readonly endereco: string;
  readonly setores: number;
}

export interface PreferenciasNotificacao {
  readonly novaOcorrencia: boolean;
  readonly licencaVencendo: boolean;
  readonly resumoSemanal: boolean;
  readonly cadaRegistro: boolean;
}

export interface Configuracoes {
  readonly unidade: UnidadeConfiguracao;
  /** Meta de recuperação por mês, em quilos. */
  readonly metaRecuperacaoKg: number;
  readonly notificacoes: PreferenciasNotificacao;
  /** Deixa o mascote sugerir ações no painel. */
  readonly insights: boolean;
}

export interface ParcialConfiguracoes {
  readonly metaRecuperacaoKg?: number;
  readonly notificacoes?: Partial<PreferenciasNotificacao>;
  readonly insights?: boolean;
}
