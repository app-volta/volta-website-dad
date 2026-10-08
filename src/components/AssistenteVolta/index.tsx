import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import {
  assinarConversa,
  iniciarConversa,
  lerConversa,
  perguntar,
  SUGESTOES_ASSISTENTE,
} from "../../services/assistente";
import type { MensagemAssistente } from "../../types/assistente";
import { Icone } from "../Icone";
import { Mascote } from "../Mascote";
import "./styles.css";

interface AssistenteVoltaProps {
  readonly aoFechar: () => void;
}

function Texto({ mensagem }: { readonly mensagem: MensagemAssistente }): ReactNode {
  return mensagem.trechos.map((trecho, indice) =>
    trecho.destaque ? (
      <strong key={indice}>{trecho.texto}</strong>
    ) : (
      <span key={indice}>{trecho.texto}</span>
    ),
  );
}

/** Painel lateral de conversa com o assistente; a conversa dura até recarregar a página. */
export function AssistenteVolta({ aoFechar }: AssistenteVoltaProps): ReactNode {
  const navegar = useNavigate();
  const { usuario } = useAuth();
  const idTitulo = useId();
  const painel = useRef<HTMLDivElement | null>(null);
  const entrada = useRef<HTMLInputElement | null>(null);
  const fimDasMensagens = useRef<HTMLDivElement | null>(null);

  const { mensagens, pensando } = useSyncExternalStore(assinarConversa, lerConversa);
  const [texto, setTexto] = useState<string>("");
  const primeiroNome = usuario?.nome.split(" ")[0] ?? "";

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    entrada.current?.focus();
    return () => anterior?.focus();
  }, []);

  useEffect(() => {
    void iniciarConversa();
  }, []);

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent): void {
      if (evento.key === "Escape") aoFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  useEffect(() => {
    fimDasMensagens.current?.scrollIntoView({ block: "end" });
  }, [mensagens.length, pensando]);

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    const pergunta = texto.trim();
    if (!pergunta || pensando) return;
    setTexto("");
    void perguntar(pergunta);
  }

  function abrirDestino(destino: string): void {
    aoFechar();
    navegar(destino);
  }

  return (
    <div
      ref={painel}
      className="assist"
      role="dialog"
      aria-modal="false"
      aria-labelledby={idTitulo}
    >
      <header className="assist__topo">
        <svg
          className="assist__seta"
          viewBox="0 0 226.493 235.874"
          fill="none"
          aria-hidden="true"
        >
          <g opacity="0.13">
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
          </g>
        </svg>

        <div className="assist__marca">
          <span id={idTitulo} className="assist__nome">
            VOLTA
          </span>
          <span className="assist__ia">IA</span>
        </div>
        <p className="assist__status">
          <span className="assist__ponto" aria-hidden="true" />
          assistente da unidade · online
        </p>
        <p className="assist__saudacao">
          Oi, {primeiroNome || "tudo bem"}! Como posso ajudar na gestão hoje?
        </p>

        <div className="assist__mascote" aria-hidden="true">
          <Mascote tamanho={84} altura={145} />
        </div>
        <button
          type="button"
          className="assist__fechar"
          aria-label="Fechar assistente"
          onClick={aoFechar}
        >
          <Icone nome="fechar" tamanho={14} />
        </button>
      </header>

      <div className="assist__conversa" role="log" aria-live="polite" aria-label="Conversa">
        {mensagens.map((mensagem) =>
          mensagem.autor === "assistente" ? (
            <div key={mensagem.id} className="assist__linha">
              <span className="assist__avatar" aria-hidden="true">
                <Mascote tamanho={26} altura={44} />
              </span>
              <div className="assist__balao">
                <p>
                  <Texto mensagem={mensagem} />
                </p>
                {mensagem.acao ? (
                  <button
                    type="button"
                    className="assist__acao"
                    onClick={() => abrirDestino(mensagem.acao?.destino ?? "/")}
                  >
                    {mensagem.acao.rotulo}
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div key={mensagem.id} className="assist__linha assist__linha--usuario">
              <div className="assist__balao assist__balao--usuario">
                <p>
                  <Texto mensagem={mensagem} />
                </p>
              </div>
            </div>
          ),
        )}
        {pensando ? (
          <div className="assist__linha">
            <span className="assist__avatar" aria-hidden="true">
              <Mascote tamanho={26} altura={44} />
            </span>
            <div className="assist__balao assist__balao--pensando" aria-label="Escrevendo resposta">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : null}
        <div ref={fimDasMensagens} />
      </div>

      <div className="assist__rodape">
        <ul className="assist__sugestoes" aria-label="Sugestões de pergunta">
          {SUGESTOES_ASSISTENTE.map((sugestao) => (
            <li key={sugestao}>
              <button
                type="button"
                className="assist__sugestao"
                disabled={pensando}
                onClick={() => void perguntar(sugestao)}
              >
                {sugestao}
              </button>
            </li>
          ))}
        </ul>
        <form className="assist__form" onSubmit={enviar}>
          <label className="sr-only" htmlFor={`${idTitulo}-pergunta`}>
            Pergunte ao VOLTA
          </label>
          <input
            ref={entrada}
            id={`${idTitulo}-pergunta`}
            type="text"
            placeholder="Pergunte ao VOLTA…"
            autoComplete="off"
            maxLength={200}
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
          />
          <button
            type="submit"
            className="assist__enviar"
            aria-label="Enviar pergunta"
            disabled={pensando || texto.trim() === ""}
          >
            <Icone nome="enviar" tamanho={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
