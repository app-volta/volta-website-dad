import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Icone } from "../../components/Icone";
import { LogoVolta } from "../../components/LogoVolta";
import { PainelAcesso } from "../../components/PainelAcesso";
import { TEXTOS_DE_ENTRADA } from "../../components/PainelAcesso/textos";
import { Rodape } from "../../components/Rodape";
import { useAuth } from "../../context/AuthContext";
import { useAcoesDeSenha } from "../../hooks/useAcoesDeSenha";
import { EtapaCodigo } from "./EtapaCodigo";
import { EtapaEmail } from "./EtapaEmail";
import { EtapaNovaSenha } from "./EtapaNovaSenha";
import { EtapaPronto } from "./EtapaPronto";
import "../Login/styles.css";
import "./styles.css";

type Etapa = "email" | "codigo" | "senha" | "pronto";

/** O que o mascote diz em cada etapa, como no Figma. */
const BALAO: Readonly<Record<Etapa, string>> = {
  email: "Acontece! Eu te ajudo a voltar pro painel.",
  codigo: "Olha o e-mail! O código chega em segundos.",
  senha: "Escolhe uma que dê pra lembrar, hein!",
  pronto: "Prontinho! Senha nova em folha.",
};

/**
 * Esqueci minha senha, em quatro passos: e-mail, código de 4 dígitos, nova senha
 * e confirmação. O e-mail e o código ficam só na memória desta tela (nunca no
 * endereço nem no armazenamento do navegador) e somem ao sair dela.
 */
export default function RecuperarSenha(): ReactNode {
  const { sessao } = useAuth();
  const navegar = useNavigate();
  const senha = useAcoesDeSenha();
  const [etapa, setEtapa] = useState<Etapa>("email");
  const [email, setEmail] = useState<string>("");
  const [codigo, setCodigo] = useState<string>("");

  useEffect(() => {
    if (sessao) navegar("/", { replace: true });
  }, [sessao, navegar]);

  async function pedirCodigo(novoEmail: string): Promise<void> {
    await senha.pedirCodigo(novoEmail);
    setEmail(novoEmail);
    setEtapa("codigo");
  }

  async function confirmarCodigo(digitos: string): Promise<void> {
    await senha.conferirCodigo(email, digitos);
    setCodigo(digitos);
    setEtapa("senha");
  }

  async function salvarSenha(novaSenha: string): Promise<void> {
    await senha.redefinir(email, codigo, novaSenha);
    setCodigo("");
    setEtapa("pronto");
  }

  return (
    <div className="login-tela">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <PainelAcesso {...TEXTOS_DE_ENTRADA} balao={[BALAO[etapa]]} />

      <div className="login-tela__form-lado login-tela__form-lado--entrar">
        <div className="login-tela__form-card">
          {etapa === "email" ? (
            <Link to="/login" className="recuperar__voltar">
              <Icone nome="seta-esquerda" tamanho={14} />
              Voltar ao login
            </Link>
          ) : etapa === "codigo" || etapa === "senha" ? (
            <button
              type="button"
              className="recuperar__voltar"
              onClick={() => setEtapa(etapa === "codigo" ? "email" : "codigo")}
            >
              <Icone nome="seta-esquerda" tamanho={14} />
              Voltar
            </button>
          ) : null}

          <header className="login-tela__form-logo">
            <LogoVolta altura={42} />
          </header>
          <main id="conteudo" className="login-tela__form-principal" tabIndex={-1}>
            {etapa === "email" ? (
              <EtapaEmail emailInicial={email} aoEnviarCodigo={pedirCodigo} />
            ) : etapa === "codigo" ? (
              <EtapaCodigo
                email={email}
                dicaDaDemonstracao={senha.codigoDaDemonstracao}
                aoConfirmar={confirmarCodigo}
                aoReenviar={() => senha.pedirCodigo(email)}
              />
            ) : etapa === "senha" ? (
              <EtapaNovaSenha aoSalvar={salvarSenha} />
            ) : (
              <EtapaPronto aoIrParaOLogin={() => navegar("/login")} />
            )}
          </main>
        </div>
      </div>
      <Rodape className="login-tela__rodape" />
    </div>
  );
}
