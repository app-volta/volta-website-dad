import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";

import type { Cooperativa } from "../../../types/cooperativa";
import { cooperativasNoRaio, temDistancias } from "../../../utils/cooperativas";
import type { Coordenadas } from "../../../utils/geo";
import { corDaCooperativa } from ".././cores";

const RAIO_KM = 10;
/**
 * Mapa do OpenStreetMap. Os mapas claros da CARTO passaram a exigir chave, e o
 * servidor do OpenStreetMap não exige (a política de uso pede crédito e uso leve).
 */
const URL_DOS_MAPAS = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const CREDITO =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">Colaboradores do OpenStreetMap</a>';
/** Sem nada para mostrar, o mapa abre no Brasil. */
const CENTRO_DO_BRASIL: L.LatLngExpression = [-14.2, -51.9];

const PINO =
  '<svg viewBox="0 0 26 36" aria-hidden="true" focusable="false"><path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 23 13 23s13-13.25 13-23C26 5.82 20.18 0 13 0Z" fill="currentColor"/><circle cx="13" cy="13" r="5.5" fill="#fff"/></svg>';

interface MapaCooperativasProps {
  readonly todas: readonly Cooperativa[];
  readonly selecionadaId: string | null;
  readonly aoSelecionar: (id: string) => void;
  /** De onde a unidade envia o resíduo; sem isso o mapa se ajusta às cooperativas. */
  readonly origem: Coordenadas | null;
}

interface CooperativaNoMapa extends Cooperativa {
  readonly latitude: number;
  readonly longitude: number;
}

function temLocal(coop: Cooperativa): coop is CooperativaNoMapa {
  return coop.latitude !== null && coop.longitude !== null;
}

function icone(cor: string): L.DivIcon {
  return L.divIcon({
    className: "coops__ponto",
    html: `<span class="coops__marcador" data-cor="${cor}">${PINO}</span>`,
    iconSize: [26, 36],
    iconAnchor: [13, 36],
  });
}

/** Enquadra o raio de 10 km da unidade ou, com `tudo`, todos os pontos (unidade e cooperativas). */
function enquadrar(
  mapa: L.Map,
  cooperativas: readonly CooperativaNoMapa[],
  origem: Coordenadas | null,
  tudo: boolean,
): void {
  if (origem && !tudo) {
    mapa.fitBounds(
      L.latLng(origem.latitude, origem.longitude).toBounds(RAIO_KM * 2000),
      { padding: [8, 8] },
    );
    return;
  }
  const pontos = cooperativas.map((coop) => L.latLng(coop.latitude, coop.longitude));
  if (origem) pontos.push(L.latLng(origem.latitude, origem.longitude));
  if (pontos.length === 0) return;
  mapa.fitBounds(L.latLngBounds(pontos), { padding: [40, 40], maxZoom: 14 });
}

/**
 * Mapa das cooperativas (Leaflet sobre o mapa do OpenStreetMap). A unidade fica
 * na posição real, com o círculo de 10 km em escala, e cada cooperativa no
 * lugar da sua sede. Quem não tem coordenadas não aparece no mapa, só na lista.
 */
export function MapaCooperativas({
  todas,
  selecionadaId,
  aoSelecionar,
  origem,
}: MapaCooperativasProps): ReactNode {
  const quadro = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<L.Map | null>(null);
  const camada = useRef<L.LayerGroup | null>(null);
  const selecionar = useRef(aoSelecionar);
  const total = cooperativasNoRaio(todas, RAIO_KM);
  const noMapa = useMemo(() => todas.filter(temLocal), [todas]);

  useEffect(() => {
    selecionar.current = aoSelecionar;
  }, [aoSelecionar]);

  // O mapa nasce uma vez e some junto com o componente.
  useEffect(() => {
    if (!quadro.current) return undefined;
    const instancia = L.map(quadro.current, {
      attributionControl: false,
      scrollWheelZoom: false,
    }).setView(CENTRO_DO_BRASIL, 4);
    L.tileLayer(URL_DOS_MAPAS, { maxZoom: 19 }).addTo(instancia);
    L.control.attribution({ prefix: false }).addAttribution(CREDITO).addTo(instancia);
    camada.current = L.layerGroup().addTo(instancia);
    mapa.current = instancia;

    // O painel muda de tamanho com a janela: o mapa precisa saber para não cortar os ladrilhos.
    const observador = new ResizeObserver(() => instancia.invalidateSize());
    observador.observe(quadro.current);
    return () => {
      observador.disconnect();
      instancia.remove();
      mapa.current = null;
      camada.current = null;
    };
  }, []);

  // Enquadra de novo só quando a unidade ou a lista mudam, não a cada seleção.
  useEffect(() => {
    if (mapa.current) enquadrar(mapa.current, noMapa, origem, false);
  }, [noMapa, origem]);

  // Desenha a unidade, o círculo e os pinos; o selecionado fica maior e na frente.
  useEffect(() => {
    const grupo = camada.current;
    if (!grupo) return;
    grupo.clearLayers();

    if (origem) {
      const centro = L.latLng(origem.latitude, origem.longitude);
      L.circle(centro, {
        radius: RAIO_KM * 1000,
        color: "#1ba463",
        opacity: 0.55,
        weight: 1.6,
        dashArray: "6 5",
        fillColor: "#1ba463",
        fillOpacity: 0.06,
        interactive: false,
      }).addTo(grupo);
      L.circleMarker(centro, {
        radius: 6,
        color: "#fff",
        weight: 2,
        fillColor: "#e0435c",
        fillOpacity: 1,
        interactive: false,
      }).addTo(grupo);
    }

    for (const coop of noMapa) {
      const selecionada = coop.id === selecionadaId;
      const marcador = L.marker([coop.latitude, coop.longitude], {
        icon: icone(corDaCooperativa(coop.id, todas)),
        title: coop.nome,
        zIndexOffset: selecionada ? 1000 : 0,
      }).addTo(grupo);
      marcador.on("click", () => selecionar.current(coop.id));
      const elemento = marcador.getElement();
      if (elemento) {
        elemento.setAttribute("aria-label", `Ver ${coop.nome}`);
        elemento.setAttribute("aria-pressed", String(selecionada));
        elemento.classList.toggle("coops__ponto--selecionado", selecionada);
      }
    }
  }, [noMapa, todas, selecionadaId, origem]);

  // Escolhida na lista, a cooperativa aparece no mapa sem mudar o zoom.
  useEffect(() => {
    const escolhida = noMapa.find((coop) => coop.id === selecionadaId);
    if (mapa.current && escolhida) {
      mapa.current.panInside([escolhida.latitude, escolhida.longitude], {
        padding: [40, 40],
      });
    }
  }, [noMapa, selecionadaId]);

  return (
    <div
      className="coops__mapa"
      role="group"
      aria-label="Mapa das cooperativas"
    >
      <div ref={quadro} className="coops__mapa-quadro" />
      {noMapa.length > 0 ? (
        <button
          type="button"
          className="coops__mapa-todas"
          onClick={() =>
            mapa.current && enquadrar(mapa.current, noMapa, origem, true)
          }
        >
          Ver todas
        </button>
      ) : null}
      <p className="coops__mapa-nota">
        {!temDistancias(todas)
          ? todas.length === 1
            ? "1 cooperativa cadastrada"
            : `${todas.length} cooperativas cadastradas`
          : total === 1
            ? "1 cooperativa num raio de 10 km da unidade"
            : `${total} cooperativas num raio de 10 km da unidade`}
      </p>
    </div>
  );
}
