import type { ReactNode } from "react";

import { useAuth } from "../../context/AuthContext";
import { ModalAcao } from "../ModalAcao";

/**
 * Aviso de sessão vencida, sobre a tela em que a pessoa estava. Não fecha com Esc
 * nem com clique fora: o único caminho é "Entrar de novo", que leva ao login e,
 * depois dele, de volta a esta página.
 */
export function ModalSessaoExpirada(): ReactNode {
  const { sessaoExpirada, entrarDeNovo } = useAuth();

  return (
    <ModalAcao
      aberto={sessaoExpirada}
      bloqueado
      centralizado
      icone="cadeado"
      tom="ambar"
      largura={520}
      titulo="Sua sessão expirou"
      subtitulo="Por segurança, você precisa entrar de novo. Depois do login, voltamos pra esta página."
      aoFechar={entrarDeNovo}
      rodape={
        <button
          type="button"
          className="modal-acao__botao modal-acao__botao--primario"
          onClick={entrarDeNovo}
        >
          Entrar de novo
        </button>
      }
    />
  );
}
