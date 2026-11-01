import { lazy, Suspense } from "react";
import type { ReactNode } from "react";

import { Icone } from "../../../components/Icone";
import type { Cooperativa } from "../../../types/cooperativa";
import {
  estadoLicenca,
  mesesDoGrafico,
  rotuloLicenca,
} from "../../../utils/cooperativas";
import {
  formatarKg,
  formatarKmOpcional,
  formatarNota,
} from "../../../utils/formatacao";
import type { Coordenadas } from "../../../utils/geo";
import { corDaCooperativa } from ".././cores";

// O Leaflet pesa uns 45 kB: fica fora do primeiro carregamento da tela.
const MapaCooperativas = lazy(() =>
  import(".././MapaCooperativas").then((modulo) => ({
    default: modulo.MapaCooperativas,
  })),
);

/** Altura, em px, da barra do maior volume. */
const ALTURA_MAXIMA_BARRA = 87;
const ALTURA_MINIMA_BARRA = 6;

interface PainelCooperativaProps {
  readonly todas: readonly Cooperativa[];
  readonly selecionada: Cooperativa | null;
  readonly aoSelecionar: (id: string) => void;
  readonly aoAbrirDocumentos: () => void;
  readonly dadosReais: boolean;
  /** De onde a unidade envia o resíduo, o centro do mapa. */
  readonly origem: Coordenadas | null;
}

export function PainelCooperativa({
  todas,
  selecionada,
  aoSelecionar,
  aoAbrirDocumentos,
  dadosReais,
  origem,
}: PainelCooperativaProps): ReactNode {
  return (
    <section className="coops__painel" aria-label="Detalhes da cooperativa">
      <Suspense
        fallback={<div className="coops__mapa" role="status" aria-label="Carregando o mapa" />}
      >
        <MapaCooperativas
          todas={todas}
          selecionadaId={selecionada?.id ?? null}
          aoSelecionar={aoSelecionar}
          origem={origem}
        />
      </Suspense>
      {selecionada ? (
        <Detalhe
          coop={selecionada}
          cor={corDaCooperativa(selecionada.id, todas)}
          aoAbrirDocumentos={aoAbrirDocumentos}
          dadosReais={dadosReais}
        />
      ) : (
        <p className="coops__painel-vazio">
          Escolha uma cooperativa para ver os detalhes.
        </p>
      )}
    </section>
  );
}

interface DetalheProps {
  readonly coop: Cooperativa;
  readonly cor: string;
  readonly aoAbrirDocumentos: () => void;
  readonly dadosReais: boolean;
}

function Detalhe({ coop, cor, aoAbrirDocumentos, dadosReais }: DetalheProps): ReactNode {
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
          <h2 className="coops__detalhe-nome">{coop.nome}</h2>
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
          <dd>{formatarKmOpcional(coop.distanciaKm)}</dd>
        </div>
        <div className="coops__kv-item">
          <dt>Capacidade/mês</dt>
          <dd>
            {coop.capacidadeMesKg === null ? "—" : formatarKg(coop.capacidadeMesKg)}
          </dd>
        </div>
        <div className="coops__kv-item">
          <dt>Avaliação</dt>
          <dd>{coop.avaliacao !== null ? `★ ${formatarNota(coop.avaliacao)}` : "—"}</dd>
        </div>
      </dl>

      <h3 className="coops__grafico-titulo">Volume destinado (últimos 5 meses)</h3>
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
        <div className="coops__email">
          {coop.email ? (
            <a
              className="coops__botao coops__botao--primario"
              href={`mailto:${coop.email}`}
              title="Abre seu aplicativo de e-mail; você ainda precisa enviar a mensagem."
            >
              <Icone nome="email" tamanho={14} />
              Enviar e-mail
            </a>
          ) : (
            <button
              type="button"
              className="coops__botao coops__botao--primario"
              disabled
              title={
                dadosReais
                  ? "A API atual não fornece o e-mail da cooperativa."
                  : "O e-mail fica disponível depois da homologação"
              }
            >
              <Icone nome="email" tamanho={14} />
              Enviar e-mail
            </button>
          )}
          {dadosReais && !coop.email ? (
            <small className="coops__email-aviso">
              Não é uma permissão do seu perfil: a API ainda não fornece o e-mail da cooperativa.
            </small>
          ) : null}
        </div>
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
