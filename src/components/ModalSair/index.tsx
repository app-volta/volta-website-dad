import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { Icone } from "../Icone";
import { ModalAcao } from "../ModalAcao";

/**
 * Confirmação antes de encerrar a sessão. Quem pede é o menu da conta, o Meu
 * perfil ou as Configurações (`pedirSaida`); o foco inicial fica em "Cancelar".
 */
export function ModalSair(): ReactNode {
  const { confirmandoSaida, cancelarSaida, sair } = useAuth();
  const navegar = useNavigate();

  function confirmar(): void {
    sair();
    navegar("/login", { replace: true });
  }

  return (
    <ModalAcao
      aberto={confirmandoSaida}
      centralizado
      icone="sair"
      tom="rosa"
      largura={520}
      titulo="Sair do painel?"
      subtitulo="Pra voltar, é só entrar de novo com seu e-mail e senha."
      aoFechar={cancelarSaida}
      rodape={
        <>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--contorno"
            onClick={cancelarSaida}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="modal-acao__botao modal-acao__botao--perigo"
            onClick={confirmar}
          >
            <Icone nome="sair" tamanho={15} />
            Sim, sair
          </button>
        </>
      }
    />
  );
}
