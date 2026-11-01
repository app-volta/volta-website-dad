import type { ReactNode } from "react";

import { useConexao } from "../../hooks/useConexao";
import { Icone } from "../Icone";
import "./styles.css";

/**
 * Faixa de "sem conexão" no topo do conteúdo. Some sozinha quando a rede volta;
 * "Tentar de novo" confirma a conexão sem recarregar a tela.
 */
export function AvisoDeConexao(): ReactNode {
  const { online, verificando, verificar } = useConexao();
  if (online) return null;

  return (
    <div className="aviso-conexao" role="status">
      <span className="aviso-conexao__icone" aria-hidden="true">
        <Icone nome="sem-conexao" tamanho={20} />
      </span>
      <div className="aviso-conexao__texto">
        <strong>Sem conexão com a internet</strong>
        <span>
          Os dados abaixo podem estar desatualizados. Aprovar, recusar e exportar
          voltam quando a rede voltar.
        </span>
      </div>
      <button
        type="button"
        className="aviso-conexao__botao"
        onClick={() => void verificar()}
        disabled={verificando}
      >
        <Icone nome="ciclo" tamanho={15} />
        {verificando ? "Verificando…" : "Tentar de novo"}
      </button>
    </div>
  );
}
