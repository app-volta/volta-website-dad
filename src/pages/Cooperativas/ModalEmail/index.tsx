import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Icone } from "../../../components/Icone";
import type { NomeIcone } from "../../../components/Icone";
import { ModalAcao } from "../../../components/ModalAcao";
import { linksDeEmail } from "../../../utils/email";
import "./styles.css";

interface ModalEmailProps {
  readonly nome: string;
  readonly email: string;
  readonly aoFechar: () => void;
}

type SituacaoDaCopia = "nenhuma" | "copiado" | "falhou";

/** Quanto tempo o "Copiado" fica na tela antes de voltar a ser "Copiar". */
const TEMPO_DO_AVISO_MS = 3000;

const MENSAGEM_DA_COPIA: Readonly<Record<SituacaoDaCopia, string>> = {
  nenhuma: "",
  copiado: "Endereço copiado.",
  falhou: "Não foi possível copiar. Selecione o endereço e copie com Ctrl+C.",
};

/**
 * Escolha de onde escrever a mensagem. O link `mailto:` sozinho depende de um programa de
 * e-mail configurado no computador e, sem ele, o navegador só abre uma aba vazia; por isso a
 * janela também oferece o Outlook e o Gmail na web e a cópia do endereço.
 */
export function ModalEmail({ nome, email, aoFechar }: ModalEmailProps): ReactNode {
  const links = linksDeEmail(email);
  const [copia, setCopia] = useState<SituacaoDaCopia>("nenhuma");
  const temporizador = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (temporizador.current !== null) window.clearTimeout(temporizador.current);
    },
    [],
  );

  async function copiar(): Promise<void> {
    let resultado: SituacaoDaCopia = "copiado";
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      resultado = "falhou";
    }
    setCopia(resultado);
    if (temporizador.current !== null) window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => setCopia("nenhuma"), TEMPO_DO_AVISO_MS);
  }

  return (
    <ModalAcao
      aberto
      icone="email"
      tom="verde"
      largura={480}
      titulo="Enviar e-mail"
      subtitulo={`Para ${nome}. Escolha onde escrever a mensagem.`}
      aoFechar={aoFechar}
      rodape={
        <button
          type="button"
          className="modal-acao__botao modal-acao__botao--contorno"
          onClick={aoFechar}
        >
          Fechar
        </button>
      }
    >
      <div className="email-opcoes__endereco">
        <span className="email-opcoes__texto">{email}</span>
        <button type="button" className="email-opcoes__copiar" onClick={() => void copiar()}>
          <Icone nome={copia === "copiado" ? "check" : "copiar"} tamanho={14} />
          {copia === "copiado" ? "Copiado" : "Copiar"}
        </button>
      </div>
      {/* Quem usa leitor de tela ouve o resultado da cópia; na tela, o botão vira "Copiado". */}
      <span className="sr-only" role="status" aria-live="polite">
        {MENSAGEM_DA_COPIA[copia]}
      </span>
      {copia === "falhou" ? (
        <p className="email-opcoes__aviso" aria-hidden="true">
          {MENSAGEM_DA_COPIA.falhou}
        </p>
      ) : null}

      <ul className="email-opcoes__lista">
        <Opcao
          href={links.outlook}
          nova
          icone="email"
          titulo="Outlook na web"
          texto="Abre uma nova mensagem no Outlook, no navegador."
        />
        <Opcao
          href={links.gmail}
          nova
          icone="email"
          titulo="Gmail"
          texto="Abre uma nova mensagem no Gmail, no navegador."
        />
        <Opcao
          href={links.aplicativo}
          icone="enviar"
          titulo="Aplicativo de e-mail do computador"
          texto="Só funciona se o computador tiver um programa de e-mail configurado."
        />
      </ul>
    </ModalAcao>
  );
}

interface OpcaoProps {
  readonly href: string;
  /** Abre em outra aba (as opções da web); o aplicativo do computador não precisa. */
  readonly nova?: boolean;
  readonly icone: NomeIcone;
  readonly titulo: string;
  readonly texto: string;
}

function Opcao({ href, nova = false, icone, titulo, texto }: OpcaoProps): ReactNode {
  return (
    <li>
      <a
        className="email-opcoes__opcao"
        href={href}
        {...(nova ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <span className="email-opcoes__icone" aria-hidden="true">
          <Icone nome={icone} tamanho={18} />
        </span>
        <span className="email-opcoes__textos">
          <strong>{titulo}</strong>
          <small>{texto}</small>
        </span>
        {nova ? (
          <span className="email-opcoes__externo">
            <Icone nome="externo" tamanho={14} />
            <span className="sr-only">(abre em outra aba)</span>
          </span>
        ) : null}
      </a>
    </li>
  );
}
