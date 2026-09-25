import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { ChatMessage } from "../../components/ChatMessage";
import { Spinner } from "../../components/Spinner";
import { TextArea } from "../../components/TextArea";
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

  const referenciaLista = useRef<HTMLUListElement | null>(null);

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
    if (referenciaLista.current) {
      referenciaLista.current.scrollTop = referenciaLista.current.scrollHeight;
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

  return (
    <section aria-labelledby="titulo-chat" className="chat">
      <Link to="/cooperativas" className="chat__voltar">
        ← Voltar para cooperativas
      </Link>
      <header className="chat__cabecalho">
        <h1 id="titulo-chat">
          Chat com {cooperativa?.nome ?? "cooperativa"}
        </h1>
        {cooperativa ? (
          <p className="chat__meta">
            {cooperativa.cidade}/{cooperativa.estado} — {cooperativa.telefone}
          </p>
        ) : null}
      </header>

      {erroCoop ? <Alerta variante="erro">{erroCoop}</Alerta> : null}
      {erro ? <Alerta variante="erro">{erro}</Alerta> : null}
      {erroEnvio ? <Alerta variante="erro">{erroEnvio}</Alerta> : null}

      {carregando ? (
        <Spinner rotulo="Carregando conversa…" />
      ) : (
        <ul
          className="chat__lista"
          ref={referenciaLista}
          aria-live="polite"
          aria-label={`Conversa com ${cooperativa?.nome ?? "cooperativa"}`}
        >
          {mensagens && mensagens.length > 0 ? (
            mensagens.map((mensagem) => (
              <ChatMessage key={mensagem.id} mensagem={mensagem} />
            ))
          ) : (
            <li className="lista-vazia">
              Nenhuma mensagem ainda. Envie a primeira.
            </li>
          )}
        </ul>
      )}

      <form onSubmit={submeter} className="chat__form" noValidate>
        <TextArea
          rotulo="Nova mensagem"
          value={texto}
          onChange={setTexto}
          rows={3}
          erro={erroCampo}
          required
          ajuda="Máximo de 500 caracteres."
        />
        <div className="chat__acao">
          <Button type="submit" carregando={enviando}>
            Enviar
          </Button>
        </div>
      </form>
    </section>
  );
}
