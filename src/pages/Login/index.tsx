import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { Icone } from "../../components/Icone";
import { Input } from "../../components/Input";
import { LogoVolta } from "../../components/LogoVolta";
import { useAuth } from "../../context/AuthContext";
import { combinar, validarEmail, validarSenha } from "../../utils/validadores";
import "./styles.css";

interface FormularioLogin {
  readonly email: string;
  readonly senha: string;
}

interface EstadoLocalizacao {
  readonly de?: string;
}

export default function Login(): ReactNode {
  const { entrar, carregando, erro, limparErro, sessao } = useAuth();
  const navegar = useNavigate();
  const localizacao = useLocation();
  const estadoDe = (localizacao.state as EstadoLocalizacao | null)?.de;

  const [formulario, setFormulario] = useState<FormularioLogin>({
    email: "",
    senha: "",
  });
  const [errosCampo, setErrosCampo] = useState<Readonly<Record<string, string>>>(
    {},
  );
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);

  useEffect(() => {
    if (sessao) navegar(estadoDe ?? "/", { replace: true });
  }, [sessao, navegar, estadoDe]);

  async function tratarSubmit(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    limparErro();
    const validacao = combinar({
      email: validarEmail(formulario.email),
      senha: validarSenha(formulario.senha),
    });
    setErrosCampo(validacao.erros);
    if (!validacao.valido) return;
    try {
      await entrar({ email: formulario.email, senha: formulario.senha });
    } catch {
      /* erro tratado no contexto */
    }
  }

  return (
    <div className="login-tela">
      <aside className="login-tela__hero" aria-hidden="true">
        <div className="login-tela__hero-orbes" />
        <div className="login-tela__hero-conteudo">
          <div className="login-tela__hero-logo">
            <Icone nome="reciclagem" tamanho={64} />
          </div>
          <div>
            <h2 className="login-tela__hero-titulo">
              O descarte certo começa com uma foto.
            </h2>
            <p className="login-tela__hero-texto">
              Conectamos sua indústria às cooperativas de reciclagem, com
              classificação automática por IA e relatório PGRS pronto pra
              auditoria.
            </p>
          </div>
          <span className="login-tela__hero-tag">
            Parceira J&amp;F · JBS Ambiental
          </span>
        </div>
      </aside>

      <main id="conteudo" className="login-tela__form-lado" tabIndex={-1}>
        <div className="login-tela__form-card">
          <div className="login-tela__form-logo">
            <LogoVolta altura={40} />
          </div>
          <h1 className="login-tela__titulo">Bem-vindo de volta</h1>
          <p className="login-tela__descricao">
            Entre para continuar cuidando do descarte certo na sua unidade.
          </p>

          {erro ? (
            <Alerta variante="erro" titulo="Não foi possível entrar">
              {erro}
            </Alerta>
          ) : null}

          <form onSubmit={tratarSubmit} noValidate>
            <Input
              rotulo="E-mail da unidade"
              type="email"
              autoComplete="email"
              required
              placeholder="nome@empresa.com.br"
              value={formulario.email}
              onChange={(valor) =>
                setFormulario((atual) => ({ ...atual, email: valor }))
              }
              erro={errosCampo.email}
              iconeEsquerdo="mensagem"
            />
            <Input
              rotulo="Senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="current-password"
              required
              value={formulario.senha}
              onChange={(valor) =>
                setFormulario((atual) => ({ ...atual, senha: valor }))
              }
              erro={errosCampo.senha}
              iconeEsquerdo="cadeado"
              acaoDireita={{
                icone: "olho",
                rotulo: mostrarSenha ? "Ocultar senha" : "Mostrar senha",
                aoClicar: () => setMostrarSenha((v) => !v),
              }}
            />

            <div className="login-tela__esqueci">
              <Link to="/cadastro">Esqueci minha senha</Link>
            </div>

            <Button type="submit" larguraTotal carregando={carregando}>
              Entrar
            </Button>
          </form>

          <div className="login-tela__separador" aria-hidden="true">
            <span>ou</span>
          </div>

          <button
            type="button"
            className="login-tela__google"
            aria-label="Continuar com Google (indisponível na versão mock)"
            disabled
          >
            <Icone nome="google" tamanho={20} />
            <span>Continuar com Google</span>
          </button>

          <p className="login-tela__cadastro">
            Novo por aqui? <Link to="/cadastro">Criar conta</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
