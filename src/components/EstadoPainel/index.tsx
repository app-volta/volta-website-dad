import { useId } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import mascoteAcessoRestrito from "../../assets/mascote-acesso-restrito.png";
import mascoteDormindo from "../../assets/mascote-dormindo.png";
import mascotePergunta from "../../assets/mascote-pergunta.png";
import mascotePreocupado from "../../assets/mascote-preocupado.png";
import "./styles.css";

/** Poses do mascote do kit do Figma ("Mascote · poses"); cada estado usa a que combina com ele. */
export type PoseDoEstado =
  | "pergunta"
  | "dormindo"
  | "preocupado"
  | "acesso-restrito";

const POSES: Readonly<Record<PoseDoEstado, string>> = {
  pergunta: mascotePergunta,
  dormindo: mascoteDormindo,
  preocupado: mascotePreocupado,
  "acesso-restrito": mascoteAcessoRestrito,
};

/** Cor do selo: cinza para o neutro, verde para "tudo certo", âmbar para o que fica de fora e vermelho para falha. */
export type TomDoEstado = "neutro" | "ok" | "alerta" | "erro";

interface EstadoPainelProps {
  /** Selo curto acima do título, como "NÃO ENCONTRADO". */
  readonly tag: string;
  readonly titulo: string;
  readonly texto: string;
  readonly pose: PoseDoEstado;
  readonly tom?: TomDoEstado;
  /** `pagina` fica no meio da tela, abaixo do topo; `cartao` ocupa o lugar do conteúdo de uma tabela ou cartão. */
  readonly contexto?: "pagina" | "cartao";
  /** Nível do título: h2 dentro do painel (o h1 é o da barra superior) e h1 numa tela sozinha. */
  readonly nivelTitulo?: "h1" | "h2";
  /** As ações, com `AcaoDoEstado`. */
  readonly children?: ReactNode;
}

/**
 * Estado de uma tela inteira ou de uma lista (não encontrado, sem resultado, sem dados):
 * mascote, selo, título, texto e até duas ações.
 */
export function EstadoPainel({
  tag,
  titulo,
  texto,
  pose,
  tom = "neutro",
  contexto = "pagina",
  nivelTitulo = "h2",
  children,
}: EstadoPainelProps): ReactNode {
  const idTitulo = useId();
  const Titulo = nivelTitulo;

  return (
    <section
      className={`estado-painel estado-painel--${contexto}`}
      aria-labelledby={idTitulo}
    >
      <img
        className="estado-painel__mascote"
        src={POSES[pose]}
        width={140}
        height={140}
        alt=""
        draggable={false}
      />
      <span className={`estado-painel__tag estado-painel__tag--${tom}`}>
        {tag}
      </span>
      <Titulo id={idTitulo} className="estado-painel__titulo">
        {titulo}
      </Titulo>
      <p className="estado-painel__texto">{texto}</p>
      {children ? <div className="estado-painel__acoes">{children}</div> : null}
    </section>
  );
}

interface AcaoDoEstadoProps {
  readonly variante?: "primaria" | "secundaria";
  /** Com `para` vira um link; com `aoClicar`, um botão. */
  readonly para?: string;
  readonly aoClicar?: () => void;
  readonly children: ReactNode;
}

/** Botão ou link de um `EstadoPainel`, no estilo do Figma (primário verde ou secundário branco). */
export function AcaoDoEstado({
  variante = "primaria",
  para,
  aoClicar,
  children,
}: AcaoDoEstadoProps): ReactNode {
  const classe = `estado-painel__acao estado-painel__acao--${variante}`;
  if (para !== undefined) {
    return (
      <Link to={para} className={classe}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classe} onClick={aoClicar}>
      {children}
    </button>
  );
}
