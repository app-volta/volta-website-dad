import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Icone } from "../../components/Icone";
import type { NomeIcone } from "../../components/Icone";
import { useAuth } from "../../context/AuthContext";
import "./styles.css";

const ROTULO_PAPEL = {
  responsavel_pgrs: "Responsável técnico — PGRS",
  operador: "Operador de chão de fábrica",
} as const;

interface Preferencia {
  readonly icone: NomeIcone;
  readonly cor: "papelao" | "plastico" | "metal" | "vidro";
  readonly titulo: string;
  readonly subtitulo: string;
}

const PREFERENCIAS: readonly Preferencia[] = [
  {
    icone: "sino",
    cor: "papelao",
    titulo: "Notificações",
    subtitulo: "Avisos de novas ocorrências e coletas",
  },
  {
    icone: "grafico",
    cor: "plastico",
    titulo: "Unidade e setor",
    subtitulo: "Gerencie os locais que você acompanha",
  },
  {
    icone: "chip",
    cor: "metal",
    titulo: "Ajuda e suporte",
    subtitulo: "Central de ajuda e contato",
  },
];

function iniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Perfil(): ReactNode {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();

  if (!usuario) {
    return (
      <Alerta variante="info">Nenhuma sessão ativa detectada.</Alerta>
    );
  }

  function encerrar(): void {
    sair();
    navegar("/login");
  }

  return (
    <div className="perfil">
      <section className="perfil__cartao card" aria-label="Cabeçalho do perfil">
        <span className="perfil__avatar" aria-hidden="true">
          {iniciais(usuario.nome)}
        </span>
        <div className="perfil__cartao-info">
          <h2 className="perfil__nome">{usuario.nome}</h2>
          <p className="perfil__papel">
            {ROTULO_PAPEL[usuario.papel]} · {usuario.unidade}
          </p>
        </div>
        <button type="button" className="perfil__editar">
          <Icone nome="editar" tamanho={16} /> Editar
        </button>
      </section>

      <section aria-labelledby="perfil-info-titulo">
        <h3 id="perfil-info-titulo" className="perfil__secao-titulo">
          Informações
        </h3>
        <dl className="perfil__grid">
          <div className="perfil__stat">
            <dt>E-mail</dt>
            <dd>{usuario.email}</dd>
          </div>
          <div className="perfil__stat">
            <dt>Unidade</dt>
            <dd>{usuario.unidade}</dd>
          </div>
          <div className="perfil__stat">
            <dt>Cargo</dt>
            <dd>{ROTULO_PAPEL[usuario.papel]}</dd>
          </div>
          <div className="perfil__stat">
            <dt>Membro desde</dt>
            <dd>Março de 2024</dd>
          </div>
          <div className="perfil__stat">
            <dt>Ocorrências registradas</dt>
            <dd>12</dd>
          </div>
          <div className="perfil__stat">
            <dt>Recuperado no mês</dt>
            <dd>1.147 kg</dd>
          </div>
          <div className="perfil__stat">
            <dt>Taxa de aprovação</dt>
            <dd>94%</dd>
          </div>
          <div className="perfil__stat">
            <dt>Cooperativa preferida</dt>
            <dd>JBS Ambiental</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="perfil-prefs-titulo">
        <h3 id="perfil-prefs-titulo" className="perfil__secao-titulo">
          Preferências
        </h3>
        <ul className="perfil__prefs">
          {PREFERENCIAS.map((p) => (
            <li key={p.titulo}>
              <button type="button" className="perfil__pref">
                <span
                  className="perfil__pref-icone"
                  data-cor={p.cor}
                  aria-hidden="true"
                >
                  <Icone nome={p.icone} tamanho={18} />
                </span>
                <div>
                  <p className="perfil__pref-titulo">{p.titulo}</p>
                  <p className="perfil__pref-sub">{p.subtitulo}</p>
                </div>
                <Icone nome="seta-direita" tamanho={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" className="perfil__sair" onClick={encerrar}>
        <Icone nome="sair" tamanho={16} />
        Sair da conta
      </button>
    </div>
  );
}
