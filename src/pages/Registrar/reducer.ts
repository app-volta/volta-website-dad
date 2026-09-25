import type { ClassificacaoIA } from "../../types/classificacao";

export type Etapa =
  | "foto"
  | "descricao"
  | "localizacao"
  | "revisao"
  | "processando"
  | "sucesso";

export interface EstadoRegistrar {
  readonly etapa: Etapa;
  readonly fotoBase64: string | null;
  readonly descricao: string;
  readonly setor: string;
  readonly unidade: string;
  readonly erroCampo: Readonly<Record<string, string>>;
  readonly erroEnvio: string | null;
  readonly classificacao: ClassificacaoIA | null;
  readonly codigoGerado: string | null;
}

export type AcaoRegistrar =
  | { readonly tipo: "definir_foto"; readonly foto: string | null }
  | { readonly tipo: "definir_descricao"; readonly descricao: string }
  | { readonly tipo: "definir_setor"; readonly setor: string }
  | { readonly tipo: "definir_unidade"; readonly unidade: string }
  | { readonly tipo: "ir_para"; readonly etapa: Etapa }
  | { readonly tipo: "voltar" }
  | { readonly tipo: "prosseguir" }
  | {
      readonly tipo: "definir_erros";
      readonly erros: Readonly<Record<string, string>>;
    }
  | { readonly tipo: "iniciar_envio" }
  | {
      readonly tipo: "envio_sucesso";
      readonly classificacao: ClassificacaoIA;
      readonly codigo: string;
    }
  | { readonly tipo: "envio_erro"; readonly mensagem: string }
  | { readonly tipo: "reiniciar"; readonly unidade: string };

const ORDEM: readonly Etapa[] = ["foto", "descricao", "localizacao", "revisao"];

export function estadoInicial(unidadePadrao: string): EstadoRegistrar {
  return {
    etapa: "foto",
    fotoBase64: null,
    descricao: "",
    setor: "",
    unidade: unidadePadrao,
    erroCampo: {},
    erroEnvio: null,
    classificacao: null,
    codigoGerado: null,
  };
}

export function redutor(
  estado: EstadoRegistrar,
  acao: AcaoRegistrar,
): EstadoRegistrar {
  switch (acao.tipo) {
    case "definir_foto":
      return { ...estado, fotoBase64: acao.foto, erroCampo: {} };
    case "definir_descricao":
      return { ...estado, descricao: acao.descricao, erroCampo: {} };
    case "definir_setor":
      return { ...estado, setor: acao.setor, erroCampo: {} };
    case "definir_unidade":
      return { ...estado, unidade: acao.unidade, erroCampo: {} };
    case "ir_para":
      return { ...estado, etapa: acao.etapa, erroCampo: {} };
    case "voltar": {
      const indice = ORDEM.indexOf(estado.etapa);
      if (indice <= 0) return estado;
      return { ...estado, etapa: ORDEM[indice - 1], erroCampo: {} };
    }
    case "prosseguir": {
      const indice = ORDEM.indexOf(estado.etapa);
      if (indice < 0 || indice >= ORDEM.length - 1) return estado;
      return { ...estado, etapa: ORDEM[indice + 1], erroCampo: {} };
    }
    case "definir_erros":
      return { ...estado, erroCampo: acao.erros };
    case "iniciar_envio":
      return { ...estado, etapa: "processando", erroEnvio: null };
    case "envio_sucesso":
      return {
        ...estado,
        etapa: "sucesso",
        classificacao: acao.classificacao,
        codigoGerado: acao.codigo,
        erroEnvio: null,
      };
    case "envio_erro":
      return { ...estado, etapa: "revisao", erroEnvio: acao.mensagem };
    case "reiniciar":
      return estadoInicial(acao.unidade);
  }
}
