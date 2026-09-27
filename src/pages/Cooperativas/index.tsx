import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Icone } from "../../components/Icone";
import { SkeletonList } from "../../components/SkeletonList";
import { useCooperativas } from "../../hooks/useCooperativas";
import type { Cooperativa } from "../../types/cooperativa";
import "./styles.css";

const CORES_PIN = ["#1F8A4C", "#2F62D6", "#7A57C9"] as const;

function classeIcone(idx: number): string {
  const materiais = ["papelao", "plastico", "metal"] as const;
  return materiais[idx % materiais.length];
}

export default function Cooperativas(): ReactNode {
  const { dados, carregando, erro } = useCooperativas();

  const destaque: Cooperativa | null = dados?.[0] ?? null;
  const outras = dados?.slice(1) ?? [];

  return (
    <section className="coops" aria-labelledby="titulo-coops">
      <h2 id="titulo-coops" className="sr-only">
        Cooperativas parceiras
      </h2>

      <div className="coops__grid">
        <div className="coops__coluna">
          {erro ? (
            <Alerta variante="erro" titulo="Não foi possível carregar">
              {erro}
            </Alerta>
          ) : null}

          {carregando ? (
            <SkeletonList quantidade={3} rotulo="Carregando cooperativas" />
          ) : destaque ? (
            <>
              <div className="coops__destaque">
                <span
                  className="coops__avatar"
                  aria-hidden="true"
                >
                  <Icone nome="mensagem" tamanho={26} />
                </span>
                <div className="coops__destaque-conteudo">
                  <div className="coops__destaque-topo">
                    <h3 className="coops__destaque-nome">{destaque.nome}</h3>
                    <span className="chip coops__badge">Parceira J&amp;F</span>
                  </div>
                  <p className="coops__destaque-desc">
                    Transforma resíduo reciclável em matéria-prima.
                  </p>
                  <p className="coops__destaque-metricas">
                    <strong>{destaque.distanciaKm.toFixed(1)} km</strong> ·
                    coleta em até <strong>24h</strong> · aceita{" "}
                    <strong>{destaque.materiaisAceitos.length} materiais</strong>
                  </p>
                </div>
                <Link
                  to={`/cooperativas/${destaque.id}/chat`}
                  className="coops__destaque-cta"
                >
                  <Icone nome="mensagem" tamanho={16} />
                  Conversar
                </Link>
              </div>

              <h3 className="coops__subtitulo">Outras cooperativas próximas</h3>
              <ul className="coops__lista">
                {outras.map((c, idx) => (
                  <li key={c.id} className="coops__item">
                    <span
                      className="coops__item-avatar"
                      data-cor={classeIcone(idx)}
                      aria-hidden="true"
                    >
                      <Icone nome="reciclagem" tamanho={22} />
                    </span>
                    <div className="coops__item-textos">
                      <p className="coops__item-nome">{c.nome}</p>
                      <p className="coops__item-materiais">
                        {c.materiaisAceitos.join(", ")}
                      </p>
                      <p className="coops__item-distancia">
                        {c.distanciaKm.toFixed(1)} km de distância
                      </p>
                    </div>
                    <div className="coops__item-avaliacao">
                      <span className="coops__estrela" aria-hidden="true">
                        <Icone nome="estrela" tamanho={14} />
                      </span>
                      <span>{c.avaliacao.toFixed(1)}</span>
                    </div>
                    <Link
                      to={`/cooperativas/${c.id}/chat`}
                      className="coops__item-cta"
                    >
                      Conversar
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="lista-vazia">Nenhuma cooperativa disponível.</p>
          )}
        </div>

        <aside className="coops__mapa" aria-label="Mapa das cooperativas">
          <div className="coops__mapa-fundo">
            {dados?.slice(0, 3).map((_, idx) => {
              const cor = CORES_PIN[idx % CORES_PIN.length];
              const top = 30 + idx * 90;
              const left = 60 + (idx % 2) * 120;
              return (
                <span
                  key={idx}
                  className="coops__pin"
                  style={{ top: `${top}px`, left: `${left}px`, color: cor }}
                >
                  <Icone nome="pin" tamanho={26} />
                </span>
              );
            })}
            <div className="coops__mapa-legenda">
              {dados
                ? `${dados.length} cooperativas num raio de 10 km`
                : "Carregando parceiros…"}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
