import type { ReactNode } from "react";

interface EsqueletoDaTabelaProps {
  /** A coluna de seleção só existe para quem pode aprovar. */
  readonly comSelecao: boolean;
  readonly linhas?: number;
}

/**
 * Tabela de ocorrências enquanto a lista carrega: o mesmo cabeçalho e as mesmas
 * colunas, com barras no lugar do conteúdo. O desenho some para leitores de tela
 * e só o aviso "Carregando ocorrências" é lido.
 */
export function EsqueletoDaTabela({
  comSelecao,
  linhas = 8,
}: EsqueletoDaTabelaProps): ReactNode {
  const itens = Array.from({ length: linhas }, (_, indice) => `esqueleto-${indice}`);

  return (
    <div className="ocorrencias__tabela-card" aria-busy="true">
      <p className="sr-only" role="status">
        Carregando ocorrências
      </p>
      <div className="ocorrencias__rolagem">
        <table className="ocorrencias__tabela" aria-hidden="true">
          <thead>
            <tr>
              {comSelecao ? <th className="ocorrencias__col-check" /> : null}
              <th className="ocorrencias__col-ocorrencia">Ocorrência</th>
              <th className="ocorrencias__col-setor">Setor</th>
              <th className="ocorrencias__col-peso">Peso</th>
              <th className="ocorrencias__col-prioridade">Prioridade</th>
              <th className="ocorrencias__col-status">Status</th>
              <th className="ocorrencias__col-registrada">Registrada</th>
              <th className="ocorrencias__col-abrir" />
            </tr>
          </thead>
          <tbody>
            {itens.map((chave) => (
              <tr key={chave} className="ocorrencias__esqueleto-linha">
                {comSelecao ? (
                  <td>
                    <span className="ocorrencias__esqueleto ocorrencias__esqueleto--caixa" />
                  </td>
                ) : null}
                <td>
                  <div className="ocorrencias__esqueleto-titulo">
                    <span className="ocorrencias__esqueleto ocorrencias__esqueleto--icone" />
                    <span className="ocorrencias__esqueleto-linhas">
                      <span className="ocorrencias__esqueleto ocorrencias__esqueleto--longa" />
                      <span className="ocorrencias__esqueleto ocorrencias__esqueleto--curta" />
                    </span>
                  </div>
                </td>
                <td>
                  <span className="ocorrencias__esqueleto ocorrencias__esqueleto--media" />
                </td>
                <td>
                  <span className="ocorrencias__esqueleto ocorrencias__esqueleto--curta" />
                </td>
                <td>
                  <span className="ocorrencias__esqueleto ocorrencias__esqueleto--pilula" />
                </td>
                <td>
                  <span className="ocorrencias__esqueleto ocorrencias__esqueleto--pilula-larga" />
                </td>
                <td>
                  <span className="ocorrencias__esqueleto ocorrencias__esqueleto--media" />
                </td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
