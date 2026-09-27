import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useParams } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Icone } from "../../components/Icone";
import { Spinner } from "../../components/Spinner";
import { useChatCooperativa } from "../../hooks/useChatCooperativa";
import { obterCooperativa } from "../../services/cooperativas";
import { enviarMensagem } from "../../services/chat";
import type { Cooperativa } from "../../types/cooperativa";
import "./styles.css";

export default function ChatCooperativa(): ReactNode {
  const { id } = useParams();
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const { dados: mensagens, carregando, erro } = useChatCooperativa(
    id,
    chaveRecarga,
  );

  const [cooperativa, setCooperativa] = useState<Cooperativa | null>(null);
  const [erroCoop, setErroCoop] = useState<string | null>(null);
  const [texto, setTexto] = useState<string>("");
  const [erroCampo, setErroCampo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const listaRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!id) return;
    const controle = new AbortController();
    obterCooperativa(id, controle.signal)
      .then((coop) => {
        if (!controle.signal.aborted) setCooperativa(coop);
      })
      .catch((excecao: unknown) => {
        if (controle.signal.aborted) return;
        setErroCoop(
          excecao instanceof Error
            ? excecao.message
            : "Falha ao carregar cooperativa.",
        );
      });
    return () => controle.abort();
  }, [id]);

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensagens]);

  if (!id) {
    return (
      <Alerta variante="erro" titulo="Rota inválida">
        Nenhuma cooperativa foi identificada na URL.
      </Alerta>
    );
  }

  async function submeter(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setErroCampo(null);
    setErroEnvio(null);
    const limpo = texto.trim();
    if (!limpo) {
      setErroCampo("Escreva algo antes de enviar.");
      return;
    }
    if (limpo.length > 500) {
      setErroCampo("Mensagem longa demais (máx. 500).");
      return;
    }
    setEnviando(true);
    try {
      await enviarMensagem({ cooperativaId: id!, conteudo: limpo });
      setTexto("");
      setChaveRecarga((v) => v + 1);
    } catch (excecao) {
      setErroEnvio(
        excecao instanceof Error ? excecao.message : "Falha ao enviar.",
      );
    } finally {
      setEnviando(false);
    }
  }

  function hora(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  return (
    <div className="chat-tela">
      {cooperativa ? (
        <section className="chat-tela__destaque" aria-label="Cooperativa">
          <span className="chat-tela__destaque-avatar" aria-hidden="true">
            {cooperativa.nome.substring(0, 2).toUpperCase()}
          </span>
          <div className="chat-tela__destaque-info">
            <h3 className="chat-tela__destaque-nome">{cooperativa.nome}</h3>
            <span className="chip chat-tela__badge">Parceira J&amp;F</span>
            <p className="chat-tela__destaque-desc">
              Responde rápido · {cooperativa.distanciaKm.toFixed(1)} km · coleta
              em até 24h · aceita todos os materiais
            </p>
          </div>
        </section>
      ) : null}

      {erroCoop ? <Alerta variante="erro">{erroCoop}</Alerta> : null}
      {erro ? <Alerta variante="erro">{erro}</Alerta> : null}
      {erroEnvio ? <Alerta variante="erro">{erroEnvio}</Alerta> : null}

      <div className="chat-tela__conteudo">
        {carregando ? (
          <Spinner rotulo="Carregando conversa…" />
        ) : (
          <ul
            className="chat-tela__lista"
            ref={listaRef}
            aria-live="polite"
            aria-label="Mensagens"
          >
            {mensagens && mensagens.length > 0 ? (
              mensagens.map((m) => (
                <li
                  key={m.id}
                  className={
                    m.origem === "usuario"
                      ? "chat-tela__msg chat-tela__msg--usuario"
                      : "chat-tela__msg chat-tela__msg--cooperativa"
                  }
                >
                  <span className="chat-tela__msg-hora">{hora(m.enviadaEm)}</span>
                  <p>{m.conteudo}</p>
                </li>
              ))
            ) : (
              <li className="lista-vazia">Envie a primeira mensagem.</li>
            )}
          </ul>
        )}
      </div>

      <form onSubmit={submeter} className="chat-tela__form" noValidate>
        <label className="sr-only" htmlFor="chat-input">
          Escrever mensagem
        </label>
        <input
          id="chat-input"
          className="chat-tela__input"
          placeholder="Escrever mensagem…"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          aria-invalid={Boolean(erroCampo) || undefined}
          aria-describedby={erroCampo ? "chat-erro" : undefined}
        />
        <button
          type="submit"
          className="chat-tela__botao"
          disabled={enviando}
          aria-label={enviando ? "Enviando…" : "Enviar mensagem"}
        >
          <Icone nome="enviar" tamanho={20} />
        </button>
        {erroCampo ? (
          <p id="chat-erro" role="alert" className="chat-tela__erro">
            {erroCampo}
          </p>
        ) : null}
      </form>
    </div>
  );
}
