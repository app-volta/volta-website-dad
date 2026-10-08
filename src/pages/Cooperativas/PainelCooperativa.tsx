import type { ReactNode } from "react";

import { Icone } from "../../components/Icone";
import type { Cooperativa } from "../../types/cooperativa";
import {
  estadoLicenca,
  mesesDoGrafico,
  rotuloLicenca,
} from "../../utils/cooperativas";
import { formatarKg, formatarKm, formatarNota } from "../../utils/formatacao";
import { corDaCooperativa } from "./cores";
import { MapaCooperativas } from "./MapaCooperativas";

/** Altura, em px, da barra do maior volume. */
const ALTURA_MAXIMA_BARRA = 87;
const ALTURA_MINIMA_BARRA = 6;

interface PainelCooperativaProps {
  readonly todas: readonly Cooperativa[];
  readonly selecionada: Cooperativa | null;
  readonly aoSelecionar: (id: string) => void;
  readonly aoAbrirDocumentos: () => void;
}

export function PainelCooperativa({
  todas,
  selecionada,
  aoSelecionar,
  aoAbrirDocumentos,
}: PainelCooperativaProps): ReactNode {
  return (
    <aside className="coops__painel" aria-label="Detalhes da cooperativa">
      <MapaCooperativas
        todas={todas}
        selecionadaId={selecionada?.id ?? null}
        aoSelecionar={aoSelecionar}
      />
      {selecionada ? (
        <Detalhe
          coop={selecionada}
          cor={corDaCooperativa(selecionada.id, todas)}
          aoAbrirDocumentos={aoAbrirDocumentos}
        />
      ) : (
        <p className="coops__painel-vazio">
          Escolha uma cooperativa para ver os detalhes.
        </p>
      )}
    </aside>
  );
}

interface DetalheProps {
  readonly coop: Cooperativa;
  readonly cor: string;
  readonly aoAbrirDocumentos: () => void;
}

function Detalhe({ coop, cor, aoAbrirDocumentos }: DetalheProps): ReactNode {
  const estado = estadoLicenca(coop);
  const contato = [coop.contato, coop.telefone].filter(Boolean).join(" · ");
  const meses = mesesDoGrafico();
  const maior = Math.max(...coop.volumeMensalKg, 0);

  return (
    <div className="coops__detalhe">
      <div className="coops__detalhe-topo">
        <span className="coops__logo coops__logo--grande" data-cor={cor} aria-hidden="true">
          <span />
        </span>
        <div>
          <h3 className="coops__detalhe-nome">{coop.nome}</h3>
          <p className="coops__sub">{contato || "Contato ainda não informado"}</p>
        </div>
      </div>

      <dl className="coops__kv">
        <div className="coops__kv-item">
          <dt>Licença</dt>
          <dd className={`coops__kv-licenca coops__kv-licenca--${estado}`}>
            {rotuloLicenca(coop, new Date(), true)}
          </dd>
        </div>
        <div className="coops__kv-item">
          <dt>Distância</dt>
          <dd>{formatarKm(coop.distanciaKm)}</dd>
        </div>
        <div className="coops__kv-item">
          <dt>Capacidade/mês</dt>
          <dd>{formatarKg(coop.capacidadeMesKg)}</dd>
        </div>
        <div className="coops__kv-item">
          <dt>Avaliação</dt>
          <dd>{coop.avaliacao !== null ? `★ ${formatarNota(coop.avaliacao)}` : "—"}</dd>
        </div>
      </dl>

      <h4 className="coops__grafico-titulo">Volume destinado (últimos 5 meses)</h4>
      <ul className="coops__grafico" aria-label="Volume destinado por mês">
        {coop.volumeMensalKg.map((kg, indice) => {
          const altura =
            maior > 0
              ? Math.max(
                  ALTURA_MINIMA_BARRA,
                  Math.round((kg / maior) * ALTURA_MAXIMA_BARRA),
                )
              : ALTURA_MINIMA_BARRA;
          const ultimo = indice === coop.volumeMensalKg.length - 1;
          return (
            <li key={meses[indice]} title={`${meses[indice]}: ${formatarKg(kg)}`}>
              <span
                className={`coops__barra-volume${ultimo ? " coops__barra-volume--atual" : ""}`}
                style={{ height: `${altura}px` }}
                aria-hidden="true"
              />
              <span className="sr-only">{formatarKg(kg)} em </span>
              <span className="coops__grafico-mes">{meses[indice]}</span>
            </li>
          );
        })}
      </ul>

      <div className="coops__acoes">
        {coop.email ? (
          <a
            className="coops__botao coops__botao--primario"
            href={`mailto:${coop.email}`}
          >
            <Icone nome="email" tamanho={14} />
            Enviar e-mail
          </a>
        ) : (
          <button
            type="button"
            className="coops__botao coops__botao--primario"
            disabled
            title="O e-mail fica disponível depois da homologação"
          >
            <Icone nome="email" tamanho={14} />
            Enviar e-mail
          </button>
        )}
        <button
          type="button"
          className="coops__botao coops__botao--contorno"
          onClick={aoAbrirDocumentos}
        >
          <Icone nome="documento" tamanho={14} />
          Documentos
        </button>
      </div>
    </div>
  );
}
