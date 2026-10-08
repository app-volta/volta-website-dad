import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { listarCooperativas } from "../../services/cooperativas";
import { listarOcorrencias } from "../../services/ocorrencias";
import { filtrarBusca } from "../../utils/busca";
import type { BaseBusca, ResultadoBusca } from "../../utils/busca";
import { Icone } from "../Icone";
import "./styles.css";

interface BuscaRapidaProps {
  readonly aoFechar: () => void;
}

const BASE_VAZIA: BaseBusca = { ocorrencias: [], cooperativas: [] };

/** Paleta de busca (Ctrl K): ocorrências, cooperativas e páginas, só pelo teclado se quiser. */
export function BuscaRapida({ aoFechar }: BuscaRapidaProps): ReactNode {
  const navegar = useNavigate();
  const idEntrada = useId();
  const idLista = useId();
  const entrada = useRef<HTMLInputElement | null>(null);

  const [consulta, setConsulta] = useState<string>("");
  const [base, setBase] = useState<BaseBusca | null>(null);
  const [indiceAtivo, setIndiceAtivo] = useState<number>(0);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    entrada.current?.focus();
    return () => anterior?.focus();
  }, []);

  useEffect(() => {
    let ativo = true;
    Promise.all([listarOcorrencias(), listarCooperativas()])
      .then(([ocorrencias, cooperativas]) => {
        if (ativo) setBase({ ocorrencias, cooperativas });
      })
      .catch(() => {
        if (ativo) setBase(BASE_VAZIA);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const grupos = useMemo(
    () => filtrarBusca(base ?? BASE_VAZIA, consulta),
    [base, consulta],
  );
  const itens = useMemo(() => grupos.flatMap((grupo) => grupo.itens), [grupos]);
  const ativo = Math.min(indiceAtivo, Math.max(itens.length - 1, 0));
  const buscando = base === null && consulta.trim() !== "";

  function abrir(item: ResultadoBusca): void {
    aoFechar();
    navegar(item.destino);
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>): void {
    if (evento.key === "Escape") {
      evento.preventDefault();
      evento.stopPropagation();
      aoFechar();
    } else if (evento.key === "ArrowDown") {
      evento.preventDefault();
      if (itens.length > 0) setIndiceAtivo((ativo + 1) % itens.length);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      if (itens.length > 0) setIndiceAtivo((ativo - 1 + itens.length) % itens.length);
    } else if (evento.key === "Enter") {
      const escolhido = itens[ativo];
      if (escolhido) {
        evento.preventDefault();
        abrir(escolhido);
      }
    } else if (evento.key === "Tab") {
      // Só há um campo; manter o foco nele evita sair da paleta sem querer.
      evento.preventDefault();
    }
  }

  return (
    <div
      className="busca__fundo"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) aoFechar();
      }}
    >
      <div
        className="busca"
        role="dialog"
        aria-modal="true"
        aria-label="Busca rápida"
        onKeyDown={aoTeclar}
      >
        <div className="busca__campo">
          <span className="busca__lupa" aria-hidden="true">
            <Icone nome="lupa" tamanho={20} />
          </span>
          <label className="sr-only" htmlFor={idEntrada}>
            Buscar ocorrência, setor ou cooperativa
          </label>
          <input
            ref={entrada}
            id={idEntrada}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={idLista}
            aria-autocomplete="list"
            aria-activedescendant={itens[ativo] ? `${idLista}-${itens[ativo].id}` : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder="Buscar ocorrência, setor, cooperativa…"
            value={consulta}
            onChange={(evento) => {
              setConsulta(evento.target.value);
              setIndiceAtivo(0);
            }}
          />
        </div>

        <ul id={idLista} role="listbox" className="busca__lista" aria-label="Resultados">
          {grupos.map((grupo) => (
            <li key={grupo.titulo} role="presentation" className="busca__grupo">
              <p className="busca__grupo-titulo">{grupo.titulo}</p>
              <ul role="presentation" className="busca__itens">
                {grupo.itens.map((item) => {
                  const selecionado = itens[ativo]?.id === item.id;
                  return (
                    <li
                      key={item.id}
                      id={`${idLista}-${item.id}`}
                      role="option"
                      aria-selected={selecionado}
                      className={`busca__item${selecionado ? " busca__item--ativo" : ""}`}
                      onMouseMove={() => setIndiceAtivo(itens.findIndex((i) => i.id === item.id))}
                      onClick={() => abrir(item)}
                    >
                      <span className="busca__item-icone" aria-hidden="true">
                        <Icone nome={item.icone} tamanho={15} />
                      </span>
                      <span className="busca__item-rotulo">{item.rotulo}</span>
                      <span className="busca__item-apoio">{item.apoio}</span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>

        {itens.length === 0 ? (
          <p className="busca__vazio">
            {buscando ? "Buscando…" : `Nada encontrado para “${consulta.trim()}”.`}
          </p>
        ) : null}

        <p className="sr-only" role="status">
          {itens.length === 1 ? "1 resultado" : `${itens.length} resultados`}
        </p>
      </div>
    </div>
  );
}
