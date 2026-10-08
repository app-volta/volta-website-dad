import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Icone } from "../../components/Icone";
import { SkeletonList } from "../../components/SkeletonList";
import { Toast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { useConfiguracoes } from "../../hooks/useConfiguracoes";
import { RECUPERADO_NO_MES_KG } from "../../services/configuracoes";
import { CartaoMeta } from "./CartaoMeta";
import {
  CartaoInsights,
  CartaoNotificacoes,
  CartaoPerfil,
  CartaoUnidade,
} from "./Cartoes";
import { ModalPerfil } from "./ModalPerfil";
import "./styles.css";

interface Aviso {
  readonly titulo: string;
  readonly descricao: string;
}

export default function Configuracoes(): ReactNode {
  const navegar = useNavigate();
  const { usuario, sair, atualizarUsuario } = useAuth();
  const { dados, carregando, erro, atualizar, limparErro } = useConfiguracoes();

  const [editandoPerfil, setEditandoPerfil] = useState<boolean>(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  function sairDoPainel(): void {
    sair();
    navegar("/login", { replace: true });
  }

  async function salvarMeta(metaKg: number): Promise<boolean> {
    const salvou = await atualizar({ metaRecuperacaoKg: metaKg });
    if (salvou) {
      setAviso({
        titulo: "Meta atualizada",
        descricao: `Agora são ${metaKg.toLocaleString("pt-BR")} kg por mês.`,
      });
    }
    return salvou;
  }

  function salvarPerfil(nome: string): void {
    atualizarUsuario({ nome });
    setEditandoPerfil(false);
    setAviso({ titulo: "Perfil atualizado", descricao: `Agora você aparece como ${nome}.` });
  }

  const papel =
    usuario?.papel === "responsavel_pgrs" ? "Gestor · Responsável PGRS" : "Operador";

  return (
    <section className="cfg" aria-label="Configurações">
      {erro ? (
        <Alerta
          variante="erro"
          titulo="Não foi possível salvar"
          acao={
            <button type="button" className="cfg__fechar-alerta" onClick={limparErro}>
              Fechar
            </button>
          }
        >
          {erro}
        </Alerta>
      ) : null}

      {carregando ? (
        <SkeletonList quantidade={3} rotulo="Carregando configurações" />
      ) : dados ? (
        <div className="cfg__grade">
          <div className="cfg__coluna">
            <CartaoPerfil
              nome={usuario?.nome ?? "Usuário"}
              papel={papel}
              aoEditar={() => setEditandoPerfil(true)}
            />
            <CartaoUnidade unidade={dados.unidade} />
            <CartaoMeta
              metaKg={dados.metaRecuperacaoKg}
              recuperadoKg={RECUPERADO_NO_MES_KG}
              aoSalvar={salvarMeta}
            />
          </div>

          <div className="cfg__coluna">
            <CartaoNotificacoes
              preferencias={dados.notificacoes}
              aoAlterar={(alteracao) => void atualizar({ notificacoes: alteracao })}
            />
            <CartaoInsights
              ativo={dados.insights}
              aoAlterar={(ativo) => void atualizar({ insights: ativo })}
            />
            <button type="button" className="cfg__sair" onClick={sairDoPainel}>
              <Icone nome="sair" tamanho={14} />
              Sair do painel
            </button>
          </div>
        </div>
      ) : null}

      {editandoPerfil && usuario ? (
        <ModalPerfil
          nomeAtual={usuario.nome}
          email={usuario.email}
          aoSalvar={salvarPerfil}
          aoFechar={() => setEditandoPerfil(false)}
        />
      ) : null}

      <Toast
        aberto={aviso !== null}
        titulo={aviso?.titulo ?? ""}
        descricao={aviso?.descricao}
        aoFechar={() => setAviso(null)}
      />
    </section>
  );
}
