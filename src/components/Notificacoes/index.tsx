import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { useAcoesNotificacoes } from "../../hooks/useNotificacoes";
import type { Notificacao, TipoNotificacao } from "../../types/notificacao";
import { Icone } from "../Icone";
import type { NomeIcone } from "../Icone";
import { TextoComDestaque } from "../TextoComDestaque";
import "./styles.css";

const ICONE: Readonly<Record<TipoNotificacao, NomeIcone>> = {
  aprovacao: "check-circulo",
  licenca: "alerta",
  fila: "bandeira",
  meta: "alvo",
};

const TOM: Readonly<Record<TipoNotificacao, string>> = {
  aprovacao: "verde",
  licenca: "laranja",
  fila: "ambar",
  meta: "roxo",
};

interface NotificacoesProps {
  readonly notificacoes: readonly Notificacao[];
  readonly aoNavegar: () => void;
}

export function Notificacoes({
  notificacoes,
  aoNavegar,
}: NotificacoesProps): ReactNode {
  const { marcarComoLida, marcarTodasComoLidas } = useAcoesNotificacoes();
  const naoLidas = notificacoes.filter((item) => !item.lida).length;

  return (
    <div className="notif" role="dialog" aria-label="Notificações">
      <div className="notif__cabecalho">
        <h2 className="notif__titulo">Notificações</h2>
        <button
          type="button"
          className="notif__marcar"
          onClick={marcarTodasComoLidas}
          disabled={naoLidas === 0}
        >
          Marcar todas como lidas
        </button>
      </div>
      <ul className="notif__lista">
        {notificacoes.map((item) => (
          <li key={item.id}>
            <Link
              to={item.destino}
              className={`notif__item${item.lida ? "" : " notif__item--nova"}`}
              onClick={() => {
                marcarComoLida(item.id);
                aoNavegar();
              }}
            >
              <span
                className={`notif__icone notif__icone--${TOM[item.tipo]}`}
                aria-hidden="true"
              >
                <Icone nome={ICONE[item.tipo]} tamanho={16} />
              </span>
              <span className="notif__textos">
                <span className="notif__texto">
                  <TextoComDestaque trechos={item.trechos} />
                </span>
                <span className="notif__quando">
                  {item.lida ? null : <span className="sr-only">Não lida. </span>}
                  {item.quando}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
