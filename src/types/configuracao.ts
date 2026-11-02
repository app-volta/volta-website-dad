import type { Material } from "./material";

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

/** Como a meta do dia é calculada: a do mês dividida pelos dias, ou um valor fixo. */
export type ModoMetaDoDia = "dividir" | "fixo";

export interface MetaDoDia {
  readonly modo: ModoMetaDoDia;
  /** Quilos por dia quando o modo é "fixo"; 0 enquanto ninguém escolheu um valor. */
  readonly valorFixoKg: number;
}

/** Dias em que a unidade opera num mês (`mes` em AAAA-MM); a escolha vale só para esse mês. */
export interface DiasDeOperacao {
  readonly mes: string;
  readonly dias: number;
}

/** Meta do mês de cada material, em kg; a soma fecha a meta do mês. */
export type MetaPorMaterial = Readonly<Record<Material, number>>;

/** O que a meta faz além de aparecer na tela de metas. */
export interface AvisosDaMeta {
  /** Põe as metas no CSV do relatório PGRS. */
  readonly incluirNoPgrs: boolean;
  /** Mostra a meta (cartão, percentual e linha do gráfico) no Início do painel. */
  readonly mostrarNoInicio: boolean;
  /** Avisa nas notificações quando a meta de hoje for batida. */
  readonly avisarMetaDoDia: boolean;
  /** Alerta nas notificações quando o mês está atrás do ritmo. */
  readonly alertarRitmo: boolean;
}

export interface Configuracoes {
  readonly unidade: UnidadeConfiguracao;
  /** Meta de recuperação por mês, em quilos. */
  readonly metaRecuperacaoKg: number;
  /** A volta-api só guarda a meta do mês: a do dia e os dias de operação ficam neste navegador. */
  readonly metaDoDia: MetaDoDia;
  readonly diasDeOperacao: DiasDeOperacao | null;
  /** Meta de cada material; nula até a pessoa dividir a meta do mês. Também só neste navegador. */
  readonly metaPorMaterial: MetaPorMaterial | null;
  readonly avisosDaMeta: AvisosDaMeta;
  readonly notificacoes: PreferenciasNotificacao;
  /** Deixa o mascote sugerir ações no painel. */
  readonly insights: boolean;
}

/** O que a tela de Relatórios mostra no aviso "Metas salvas" depois que a tela de metas grava. */
export interface MetasSalvas {
  readonly mesKg: number;
  readonly diaKg: number;
}

export interface ParcialConfiguracoes {
  readonly metaRecuperacaoKg?: number;
  readonly metaDoDia?: MetaDoDia;
  readonly diasDeOperacao?: DiasDeOperacao | null;
  readonly metaPorMaterial?: MetaPorMaterial | null;
  readonly avisosDaMeta?: Partial<AvisosDaMeta>;
  readonly notificacoes?: Partial<PreferenciasNotificacao>;
  readonly insights?: boolean;
}
