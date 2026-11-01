import { useId } from "react";
import type { ReactNode } from "react";

import { Interruptor } from "../../../components/Interruptor";
import type { AvisosDaMeta } from "../../../types/configuracao";

interface CartaoAvisosDaMetaProps {
  readonly avisos: AvisosDaMeta;
  readonly aoAlterar: (chave: keyof AvisosDaMeta, ligado: boolean) => void;
}

const LINHAS: readonly { readonly chave: keyof AvisosDaMeta; readonly rotulo: string }[] = [
  { chave: "incluirNoPgrs", rotulo: "Incluir as metas no relatório PGRS" },
  { chave: "mostrarNoInicio", rotulo: "Mostrar a meta no Início do painel" },
  { chave: "avisarMetaDoDia", rotulo: "Avisar quando a meta do dia for batida" },
  { chave: "alertarRitmo", rotulo: "Alertar se o mês sair do ritmo" },
];

/**
 * 20e · Avisos da meta. Cada interruptor muda algo no painel: o CSV do relatório,
 * o Início e as notificações. A Home do app do Figma não existe aqui, então o
 * segundo vale para o Início do painel.
 */
export function CartaoAvisosDaMeta({
  avisos,
  aoAlterar,
}: CartaoAvisosDaMetaProps): ReactNode {
  const idTitulo = useId();
  return (
    <section className="metas__cartao" aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className="metas__titulo">
        Avisos da meta
      </h2>
      <div className="metas__avisos">
        {LINHAS.map((linha) => (
          <Interruptor
            key={linha.chave}
            rotulo={linha.rotulo}
            ligado={avisos[linha.chave]}
            aoAlterar={(ligado) => aoAlterar(linha.chave, ligado)}
          />
        ))}
      </div>
    </section>
  );
}
