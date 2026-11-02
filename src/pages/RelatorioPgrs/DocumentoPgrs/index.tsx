import type { ReactNode } from "react";

import logoBranca from "../../../assets/logo-volta-branca.png";
import mascote from "../../../assets/mascote.png";
import type { DocumentoPgrs as Documento, LinhaDeBarra } from "../../../utils/documentoPgrs";
import "./styles.css";

interface DocumentoPgrsProps {
  readonly documento: Documento;
}

/** O anel com seta da marca, em branco translúcido, que enfeita o canto da capa. */
function AnelDaMarca(): ReactNode {
  return (
    <svg
      className="pgrs__anel"
      viewBox="0 0 226.493 235.874"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M201.701 123.282C201.552 141.723 195.641 159.655 184.794 174.568C173.947 189.481 158.707 200.629 141.209 206.45C123.711 212.272 104.831 212.475 87.2119 207.032C69.5926 201.589 54.1166 190.773 42.9507 176.096C31.7848 161.42 25.4882 143.62 24.9423 125.187C24.3965 106.754 29.6289 88.6123 39.9068 73.3012C50.1847 57.9901 64.9935 46.2766 82.2599 39.8006C99.5262 33.3247 118.386 32.4106 136.197 37.1863"
        stroke="white"
        strokeWidth="31.2"
        strokeLinecap="round"
      />
      <path
        d="M139.539 5.20016L174.179 46.8604L123.083 65.6155L139.539 5.20016Z"
        fill="white"
        stroke="white"
        strokeWidth="10.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Barras({ linhas }: { readonly linhas: readonly LinhaDeBarra[] }): ReactNode {
  return (
    <ul className="pgrs__barras">
      {linhas.map((linha) => (
        <li
          key={linha.rotulo}
          className={linha.resto ? "pgrs__barra-linha pgrs__barra-linha--resto" : "pgrs__barra-linha"}
        >
          <span className="pgrs__barra-rotulo">{linha.rotulo}</span>
          <span className="pgrs__trilho" aria-hidden="true">
            <span className="pgrs__preenchimento" style={{ width: `${linha.barra}%` }} />
          </span>
          <span className="pgrs__barra-valor">{linha.valor}</span>
          <span className="pgrs__barra-pct">{linha.percentual}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * O documento do PGRS em duas páginas A4. É o que a pessoa vê na tela e o que o
 * navegador imprime ou salva em PDF: o CSS de impressão só tira o que está fora dele.
 */
export function DocumentoPgrs({ documento }: DocumentoPgrsProps): ReactNode {
  const paginas = 2;

  return (
    <article className="pgrs" aria-label={documento.titulo}>
      <section className="pgrs__pagina" aria-label="Página 1">
        <header className="pgrs__capa">
          <AnelDaMarca />
          <div className="pgrs__capa-topo">
            <img className="pgrs__logo" src={logoBranca} alt="VOLTA" />
            <span className="pgrs__pill">{documento.pill}</span>
          </div>
          <h1 className="pgrs__titulo">{documento.titulo}</h1>
          <p className="pgrs__subtitulo">{documento.subtitulo}</p>
        </header>

        <div className="pgrs__corpo">
          <dl className="pgrs__identificacao">
            {documento.identificacao.map((item) => (
              <div key={item.rotulo} className="pgrs__identificacao-item">
                <dt>{item.rotulo}</dt>
                <dd>{item.valor}</dd>
              </div>
            ))}
          </dl>

          <div className="pgrs__secao-titulo">
            <h2>{documento.resumo.titulo}</h2>
            {documento.resumo.comparacao ? <span>{documento.resumo.comparacao}</span> : null}
          </div>
          <ul className="pgrs__cartoes">
            {documento.resumo.cartoes.map((cartao) => (
              <li key={cartao.rotulo} className="pgrs__cartao">
                <span className="pgrs__cartao-rotulo">{cartao.rotulo}</span>
                <span className="pgrs__cartao-valor">
                  {cartao.valor}
                  {cartao.unidade ? <small>{cartao.unidade}</small> : null}
                </span>
                {cartao.rodape ? (
                  <span className={`pgrs__cartao-rodape pgrs__cartao-rodape--${cartao.tom}`}>
                    {cartao.rodape}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>

          {documento.meta ? (
            <div className="pgrs__meta">
              <div className="pgrs__meta-texto">
                <span className="pgrs__cartao-rotulo">Meta do mês</span>
                <span className="pgrs__meta-valor">
                  <strong>{documento.meta.atingido}</strong> de {documento.meta.total}
                </span>
              </div>
              <span className="pgrs__trilho pgrs__trilho--meta" aria-hidden="true">
                <span
                  className="pgrs__preenchimento pgrs__preenchimento--meta"
                  style={{ width: `${Math.min(documento.meta.percentual, 100)}%` }}
                />
              </span>
              <span className="pgrs__meta-pill">{documento.meta.percentual}% da meta</span>
            </div>
          ) : null}

          <div className="pgrs__duplo">
            <section className="pgrs__quadro" aria-labelledby="pgrs-materiais">
              <h2 id="pgrs-materiais">Recuperado por material</h2>
              <Barras linhas={documento.materiais.linhas} />
              <p className="pgrs__total">
                <span>Total recuperado</span>
                <strong>{documento.materiais.total}</strong>
              </p>
            </section>
            <section className="pgrs__quadro" aria-labelledby="pgrs-setores">
              <h2 id="pgrs-setores">Setores que mais geram resíduo</h2>
              {documento.setores.linhas.length > 0 ? (
                <Barras linhas={documento.setores.linhas} />
              ) : (
                <p className="pgrs__vazio">Nenhum setor com resíduo aprovado no período.</p>
              )}
            </section>
          </div>

          {documento.destinacao ? (
            <section aria-labelledby="pgrs-destinacao">
              <div className="pgrs__secao-titulo">
                <h2 id="pgrs-destinacao">Destinação final por cooperativa</h2>
                <span>{documento.destinacao.subtitulo}</span>
              </div>
              <table className="pgrs__tabela">
                <thead>
                  <tr>
                    <th scope="col">Cooperativa</th>
                    <th scope="col">Materiais recebidos</th>
                    <th scope="col" className="pgrs__direita">
                      Destinado
                    </th>
                    <th scope="col" className="pgrs__direita">
                      Parcela
                    </th>
                    <th scope="col">Licença ambiental</th>
                  </tr>
                </thead>
                <tbody>
                  {documento.destinacao.linhas.map((linha) => (
                    <tr key={linha.nome}>
                      <td>
                        <strong>{linha.nome}</strong>
                        {linha.distancia ? <span className="pgrs__sub">{linha.distancia}</span> : null}
                      </td>
                      <td>{linha.materiais}</td>
                      <td className="pgrs__direita pgrs__forte">{linha.destinado}</td>
                      <td className="pgrs__direita">{linha.parcela}</td>
                      <td>
                        <span className={`pgrs__selo pgrs__selo--${linha.tomDaLicenca}`}>
                          {linha.licenca}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <td />
                    <td className="pgrs__direita pgrs__forte">{documento.destinacao.totalDestinado}</td>
                    <td className="pgrs__direita pgrs__forte">{documento.destinacao.totalParcela}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </section>
          ) : null}
        </div>

        <footer className="pgrs__rodape">
          <span>{documento.rodape}</span>
          <span>Página 1 de {paginas}</span>
        </footer>
      </section>

      <section className="pgrs__pagina" aria-label="Página 2">
        <header className="pgrs__capa pgrs__capa--fina">
          <AnelDaMarca />
          <div className="pgrs__capa-topo">
            <img className="pgrs__logo pgrs__logo--pequeno" src={logoBranca} alt="VOLTA" />
            <span className="pgrs__pill">{documento.pillDaSegundaPagina}</span>
          </div>
        </header>

        <div className="pgrs__corpo">
          {documento.ocorrencias.length > 0 ? (
            <section aria-labelledby="pgrs-ocorrencias">
              <div className="pgrs__secao-titulo">
                <h2 id="pgrs-ocorrencias">Ocorrências aprovadas</h2>
                <span>
                  amostra das mais recentes · evidências fotográficas e análise da IA no painel VOLTA
                </span>
              </div>
              <table className="pgrs__tabela pgrs__tabela--ocorrencias">
                <thead>
                  <tr>
                    <th scope="col">Ocorrência</th>
                    <th scope="col">Setor</th>
                    <th scope="col">Material</th>
                    <th scope="col" className="pgrs__direita">
                      Peso
                    </th>
                    <th scope="col">Registrada por</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {documento.ocorrencias.map((linha) => (
                    <tr key={linha.id}>
                      <td>
                        <strong>{linha.codigo}</strong>
                        <span className="pgrs__sub">{linha.titulo}</span>
                      </td>
                      <td>{linha.setor}</td>
                      <td>{linha.material}</td>
                      <td className="pgrs__direita">{linha.peso}</td>
                      <td>{linha.registradaPor}</td>
                      <td>
                        <span className="pgrs__selo pgrs__selo--valida">Aprovada</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          <section aria-labelledby="pgrs-registro">
            <h2 id="pgrs-registro" className="pgrs__titulo-solto">
              Como os dados foram registrados
            </h2>
            <div className="pgrs__duplo pgrs__duplo--textos">
              <div className="pgrs__nota">
                <span className="pgrs__cartao-rotulo">Registro</span>
                <p>
                  Cada ocorrência foi registrada no app VOLTA com foto, local e setor. A IA sugere o
                  material e estima o peso; a pessoa confirma ou corrige antes de enviar.
                </p>
              </div>
              <div className="pgrs__nota">
                <span className="pgrs__cartao-rotulo">Aprovação e destinação</span>
                <p>
                  O responsável técnico revisa e aprova cada ocorrência no painel. Só entram neste
                  relatório as ocorrências aprovadas e coletadas por cooperativas homologadas.
                </p>
              </div>
            </div>
          </section>

          {documento.recomendacoes ? (
            <aside className="pgrs__recomendacoes" aria-labelledby="pgrs-recomendacoes">
              <img className="pgrs__mascote" src={mascote} alt="" width={64} height={104} />
              <div>
                <h2 id="pgrs-recomendacoes">
                  <span aria-hidden="true">✦ </span>
                  {documento.recomendacoes.titulo}
                </h2>
                <ul>
                  {documento.recomendacoes.itens.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </aside>
          ) : null}

          <section aria-labelledby="pgrs-declaracao">
            <h2 id="pgrs-declaracao" className="pgrs__titulo-solto">
              Declaração do responsável
            </h2>
            <div className="pgrs__declaracao">
              <p>{documento.declaracao}</p>
              <div className="pgrs__assinatura">
                <span className="pgrs__assinatura-nome" aria-hidden="true">
                  {documento.responsavel.nome}
                </span>
                <span className="pgrs__assinatura-linha" />
                <strong>{documento.responsavel.nome}</strong>
                <span className="pgrs__sub">{documento.responsavel.funcao}</span>
              </div>
            </div>
          </section>
        </div>

        <footer className="pgrs__rodape">
          <span>{documento.rodape} · gerado automaticamente pelo painel</span>
          <span>Página 2 de {paginas}</span>
        </footer>
      </section>
    </article>
  );
}
