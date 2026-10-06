import { useEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import mascoteCompleto from "../../assets/mascote-completo.svg";
import { METADADOS_MATERIAL } from "../../types/material";
import type { Ocorrencia } from "../../types/ocorrencia";
import { formatarPorcentagem } from "../../utils/formatacao";
import {
  ROTULO_CATEGORIA,
  ROTULO_PRIORIDADE,
  aguardaAprovacao,
  categoriaDe,
} from "../../utils/statusOcorrencia";
import { Icone } from "../Icone";
import "./styles.css";

interface GavetaOcorrenciaProps {
  readonly ocorrencia: Ocorrencia | null;
  readonly aprovando: boolean;
  readonly aoFechar: () => void;
  readonly aoAprovar: (id: string) => void;
  readonly aoAbrirCompleta: (id: string) => void;
}

const SELETOR_FOCAVEL =
  'button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])';

function contaminacao(confianca: number): string {
  if (confianca >= 0.85) return "Baixa";
  if (confianca >= 0.75) return "Média";
  return "Alta";
}

export function GavetaOcorrencia({
  ocorrencia,
  aprovando,
  aoFechar,
  aoAprovar,
  aoAbrirCompleta,
}: GavetaOcorrenciaProps): ReactNode {
  const painel = useRef<HTMLElement | null>(null);
  const botaoFechar = useRef<HTMLButtonElement | null>(null);
  const aberta = ocorrencia !== null;

  useEffect(() => {
    if (!aberta) return;
    const anterior = document.activeElement as HTMLElement | null;
    botaoFechar.current?.focus();
    return () => anterior?.focus();
  }, [aberta]);

  useEffect(() => {
    if (!aberta) return;
    function aoTeclar(evento: globalThis.KeyboardEvent): void {
      if (evento.key === "Escape") aoFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberta, aoFechar]);

  if (!ocorrencia) return null;

  function prenderFoco(evento: KeyboardEvent<HTMLElement>): void {
    if (evento.key !== "Tab" || !painel.current) return;
    const focaveis = painel.current.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL);
    if (focaveis.length === 0) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  const confianca = ocorrencia.classificacao?.confianca ?? 0;
  const material = ocorrencia.material
    ? METADADOS_MATERIAL[ocorrencia.material].rotulo
    : null;
  const tipo = material ? `${material} A` : ocorrencia.titulo;
  const podeAprovar = aguardaAprovacao(ocorrencia.status);
  const categoria = categoriaDe(ocorrencia.status);

  return (
    <>
      <div className="gaveta__fundo" onClick={aoFechar} aria-hidden="true" />
      <aside
        ref={painel}
        className="gaveta"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gaveta-titulo"
        onKeyDown={prenderFoco}
      >
        <header className="gaveta__cabecalho">
          <span
            className="gaveta__tile"
            data-material={ocorrencia.material ?? "outro"}
            aria-hidden="true"
          >
            <Icone nome={ocorrencia.material ?? "reciclagem"} tamanho={17} />
          </span>
          <div className="gaveta__titulos">
            <h2 id="gaveta-titulo" className="gaveta__titulo">
              {ocorrencia.titulo}
            </h2>
            <p className="gaveta__sub">
              #{ocorrencia.codigo.replace(/\D/g, "")} ·{" "}
              {ocorrencia.localizacao.setor}
            </p>
          </div>
          <button
            ref={botaoFechar}
            type="button"
            className="gaveta__fechar"
            onClick={aoFechar}
            aria-label="Fechar visualização rápida"
          >
            <Icone nome="fechar" tamanho={16} />
          </button>
        </header>

        <div className="gaveta__corpo">
          <div className="gaveta__foto">
            <img
              src={ocorrencia.fotoUrl}
              alt={`Foto da ocorrência ${ocorrencia.titulo}`}
            />
            <span className="gaveta__selo">
              <Icone nome="brilho" tamanho={12} />
              Confiança da IA {formatarPorcentagem(confianca)}
            </span>
          </div>

          <div className="gaveta__selos">
            <span className={`gaveta__pill gaveta__status--${categoria}`}>
              {ROTULO_CATEGORIA[categoria]}
            </span>
            <span className={`gaveta__pill gaveta__pill--${ocorrencia.prioridade}`}>
              {ROTULO_PRIORIDADE[ocorrencia.prioridade]}
            </span>
            <span className="gaveta__pill gaveta__pill--neutro">CLASSE A</span>
          </div>

          <div className="gaveta__cards">
            <div className="gaveta__card gaveta__card--tipo">
              <p>Tipo</p>
              <strong>{tipo}</strong>
            </div>
            <div className="gaveta__card gaveta__card--contaminacao">
              <p>Contaminação</p>
              <strong>{contaminacao(confianca)}</strong>
            </div>
            <div className="gaveta__card gaveta__card--quantidade">
              <p>Quantidade</p>
              <strong>≈ {ocorrencia.pesoKg} kg</strong>
            </div>
            <div className="gaveta__card gaveta__card--autor">
              <p>Registrada por</p>
              <strong>{ocorrencia.criadaPorNome}</strong>
            </div>
          </div>

          <div className="gaveta__recomenda">
            <img
              src={mascoteCompleto}
              alt=""
              width={84}
              height={127}
              className="gaveta__recomenda-mascote"
            />
            <div>
              <p className="gaveta__recomenda-titulo">
                <Icone nome="brilho" tamanho={14} /> VOLTA recomenda
              </p>
              <p className="gaveta__recomenda-texto">
                {ocorrencia.classificacao?.recomendacao ??
                  "A IA ainda está analisando esta ocorrência."}
              </p>
            </div>
          </div>

          <div className="gaveta__acoes">
            <button
              type="button"
              className="gaveta__botao gaveta__botao--contorno"
              onClick={() => aoAbrirCompleta(ocorrencia.id)}
            >
              Abrir ocorrência completa
            </button>
            {podeAprovar ? (
              <button
                type="button"
                className="gaveta__botao gaveta__botao--primario"
                onClick={() => aoAprovar(ocorrencia.id)}
                disabled={aprovando}
              >
                <Icone nome="check" tamanho={14} />
                {aprovando ? "Aprovando…" : "Aprovar"}
              </button>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
