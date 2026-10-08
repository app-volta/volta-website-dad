import type { ReactNode } from "react";

import { Icone } from "../../components/Icone";
import { Interruptor } from "../../components/Interruptor";
import { Mascote } from "../../components/Mascote";
import type {
  PreferenciasNotificacao,
  UnidadeConfiguracao,
} from "../../types/configuracao";
import { iniciais } from "../../utils/pessoa";

interface CartaoPerfilProps {
  readonly nome: string;
  readonly papel: string;
  readonly aoEditar: () => void;
}

export function CartaoPerfil({
  nome,
  papel,
  aoEditar,
}: CartaoPerfilProps): ReactNode {
  return (
    <section className="cfg__cartao cfg__perfil" aria-label="Seu perfil">
      <span className="cfg__avatar" aria-hidden="true">
        {iniciais(nome)}
      </span>
      <div className="cfg__perfil-textos">
        <h3 className="cfg__perfil-nome">{nome}</h3>
        <p className="cfg__perfil-papel">{papel}</p>
      </div>
      <button type="button" className="cfg__botao-contorno" onClick={aoEditar}>
        <Icone nome="editar" tamanho={14} />
        Editar
      </button>
    </section>
  );
}

interface CartaoUnidadeProps {
  readonly unidade: UnidadeConfiguracao;
}

export function CartaoUnidade({ unidade }: CartaoUnidadeProps): ReactNode {
  const dados: readonly { readonly rotulo: string; readonly valor: string }[] = [
    { rotulo: "Nome", valor: unidade.nome },
    { rotulo: "CNPJ", valor: unidade.cnpj },
    { rotulo: "Endereço", valor: unidade.endereco },
    { rotulo: "Setores", valor: `${unidade.setores} cadastrados` },
  ];

  return (
    <section className="cfg__cartao" aria-labelledby="cfg-unidade-titulo">
      <h3 id="cfg-unidade-titulo" className="cfg__titulo">
        Unidade
      </h3>
      <dl className="cfg__kv">
        {dados.map((item) => (
          <div key={item.rotulo} className="cfg__kv-item">
            <dt>{item.rotulo}</dt>
            <dd>{item.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

interface CartaoNotificacoesProps {
  readonly preferencias: PreferenciasNotificacao;
  readonly aoAlterar: (alteracao: Partial<PreferenciasNotificacao>) => void;
}

const OPCOES_NOTIFICACAO: readonly {
  readonly chave: keyof PreferenciasNotificacao;
  readonly rotulo: string;
}[] = [
  { chave: "novaOcorrencia", rotulo: "Nova ocorrência pra aprovar" },
  { chave: "licencaVencendo", rotulo: "Licença de cooperativa vencendo" },
  { chave: "resumoSemanal", rotulo: "Resumo semanal por e-mail" },
  { chave: "cadaRegistro", rotulo: "Cada registro da equipe" },
];

export function CartaoNotificacoes({
  preferencias,
  aoAlterar,
}: CartaoNotificacoesProps): ReactNode {
  return (
    <section className="cfg__cartao" aria-labelledby="cfg-notificacoes-titulo">
      <h3 id="cfg-notificacoes-titulo" className="cfg__titulo">
        Notificações
      </h3>
      <div className="cfg__interruptores">
        {OPCOES_NOTIFICACAO.map((opcao) => (
          <Interruptor
            key={opcao.chave}
            rotulo={opcao.rotulo}
            ligado={preferencias[opcao.chave]}
            aoAlterar={(ligado) => aoAlterar({ [opcao.chave]: ligado })}
          />
        ))}
      </div>
    </section>
  );
}

interface CartaoInsightsProps {
  readonly ativo: boolean;
  readonly aoAlterar: (ativo: boolean) => void;
}

export function CartaoInsights({
  ativo,
  aoAlterar,
}: CartaoInsightsProps): ReactNode {
  return (
    <section className="cfg__insights" aria-labelledby="cfg-insights-titulo">
      <div className="cfg__insights-mascote" aria-hidden="true">
        <Mascote tamanho={49} altura={85} />
      </div>
      <div>
        <h3 id="cfg-insights-titulo" className="cfg__insights-titulo">
          <Icone nome="brilho" tamanho={13} />
          Insights do VOLTA
        </h3>
        <p className="cfg__insights-texto">
          Deixe o mascote sugerir ações no painel com base nos registros da
          unidade.
        </p>
        <Interruptor
          compacto
          rotulo={ativo ? "Ativado" : "Desativado"}
          ligado={ativo}
          aoAlterar={aoAlterar}
        />
      </div>
    </section>
  );
}
