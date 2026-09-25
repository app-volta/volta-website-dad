import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { OcorrenciaCard } from "../../components/OcorrenciaCard";
import { SkeletonList } from "../../components/SkeletonList";
import { useAuth } from "../../context/AuthContext";
import { useOcorrencias } from "../../hooks/useOcorrencias";
import { MATERIAIS, METADADOS_MATERIAL } from "../../types/material";
import "./styles.css";

export default function Home(): ReactNode {
  const { usuario } = useAuth();
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const { dados, carregando, erro } = useOcorrencias(chaveRecarga);

  const contagens = useMemo(() => {
    const inicial: Record<string, number> = {
      papelao: 0,
      plastico: 0,
      metal: 0,
      vidro: 0,
    };
    if (!dados) return inicial;
    for (const ocorrencia of dados) {
      if (ocorrencia.material) {
        inicial[ocorrencia.material] = (inicial[ocorrencia.material] ?? 0) + 1;
      }
    }
    return inicial;
  }, [dados]);

  const recentes = useMemo(() => (dados ?? []).slice(0, 3), [dados]);

  return (
    <>
      <section className="home__hero" aria-labelledby="titulo-home">
        <div>
          <p className="home__saudacao">
            Olá, {usuario?.nome.split(" ")[0] ?? "colega"} 👋
          </p>
          <h1 id="titulo-home" className="home__titulo">
            Painel VOLTA
          </h1>
          <p className="home__subtitulo">
            Acompanhe seus resíduos, gere relatórios PGRS e converse com
            cooperativas parceiras em um só lugar.
          </p>
          <div className="home__acoes">
            <Link to="/registrar" className="home__cta">
              Registrar novo resíduo
            </Link>
            <Link to="/ocorrencias" className="home__cta home__cta--secundario">
              Ver ocorrências
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="titulo-materiais" className="home__secao">
        <h2 id="titulo-materiais" className="home__secao-titulo">
          Resumo por material
        </h2>
        <ul className="home__cartoes-materiais">
          {MATERIAIS.map((material) => {
            const metadados = METADADOS_MATERIAL[material];
            return (
              <li
                key={material}
                className="home__cartao-material"
                style={{
                  background: metadados.corFundo,
                  color: metadados.corTexto,
                }}
              >
                <span className="home__cartao-emoji" aria-hidden="true">
                  {metadados.emoji}
                </span>
                <span className="home__cartao-rotulo">{metadados.rotulo}</span>
                <strong className="home__cartao-numero">
                  {contagens[material] ?? 0}
                </strong>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="titulo-recentes" className="home__secao">
        <div className="home__secao-cabecalho">
          <h2 id="titulo-recentes" className="home__secao-titulo">
            Ocorrências recentes
          </h2>
          <Link to="/ocorrencias" className="home__link">
            Ver todas →
          </Link>
        </div>

        {erro ? (
          <Alerta
            variante="erro"
            titulo="Não foi possível carregar"
            acao={
              <button
                type="button"
                className="home__link"
                onClick={() => setChaveRecarga((v) => v + 1)}
              >
                Tentar novamente
              </button>
            }
          >
            {erro}
          </Alerta>
        ) : null}

        {carregando ? (
          <SkeletonList quantidade={3} rotulo="Carregando ocorrências recentes" />
        ) : recentes.length > 0 ? (
          <div className="home__lista">
            {recentes.map((ocorrencia) => (
              <OcorrenciaCard key={ocorrencia.id} ocorrencia={ocorrencia} />
            ))}
          </div>
        ) : (
          !erro && (
            <p className="lista-vazia">Ainda não há ocorrências registradas.</p>
          )
        )}
      </section>
    </>
  );
}
