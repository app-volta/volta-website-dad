import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import "./styles.css";

const ROTULOS_PAPEL = {
  responsavel_pgrs: "Responsável PGRS",
  operador: "Operador de chão de fábrica",
} as const;

export default function Perfil(): ReactNode {
  const { usuario, sessao, sair } = useAuth();
  const navegar = useNavigate();

  if (!usuario || !sessao) {
    return (
      <Alerta variante="info">Nenhuma sessão ativa detectada.</Alerta>
    );
  }

  function encerrar(): void {
    sair();
    navegar("/login");
  }

  return (
    <section aria-labelledby="titulo-perfil" className="perfil">
      <h1 id="titulo-perfil">Meu perfil</h1>
      <div className="card perfil__cartao">
        <p className="perfil__nome">{usuario.nome}</p>
        <dl className="perfil__dados">
          <div>
            <dt>E-mail</dt>
            <dd>{usuario.email}</dd>
          </div>
          <div>
            <dt>Perfil de acesso</dt>
            <dd>{ROTULOS_PAPEL[usuario.papel]}</dd>
          </div>
          <div>
            <dt>Unidade</dt>
            <dd>{usuario.unidade}</dd>
          </div>
          <div>
            <dt>Sessão expira em</dt>
            <dd>{new Date(sessao.expiraEm).toLocaleString("pt-BR")}</dd>
          </div>
        </dl>
        <Button variante="perigo" onClick={encerrar}>
          Encerrar sessão
        </Button>
      </div>
    </section>
  );
}
