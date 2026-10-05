import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { Icone } from "../../components/Icone";
import { Input } from "../../components/Input";
import { LogoVolta } from "../../components/LogoVolta";
import { PainelAcesso } from "../../components/PainelAcesso";
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
  const [manterConectado, setManterConectado] = useState<boolean>(true);

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
      <PainelAcesso
        titulo={["Cuidar do descarte", "ficou simples."]}
        texto="Aprove ocorrências, acompanhe metas e gerencie as cooperativas parceiras da sua unidade num lugar só."
        destaques={[
          "Aprovação de ocorrências em um clique",
          "Relatório PGRS gerado automaticamente",
          "Cooperativas homologadas e com licença em dia",
        ]}
      />

      <main
        id="conteudo"
        className="login-tela__form-lado login-tela__form-lado--entrar"
        tabIndex={-1}
      >
        <div className="login-tela__form-card">
          <div className="login-tela__form-logo">
            <LogoVolta altura={42} />
          </div>
          <h1 className="login-tela__titulo">Bem-vindo de volta</h1>
          <p className="login-tela__descricao">
            Entre com o e-mail da sua unidade.
          </p>

          {erro ? (
            <Alerta variante="erro" titulo="Não foi possível entrar">
              {erro}
            </Alerta>
          ) : null}

          <form onSubmit={tratarSubmit} noValidate>
            <Input
              rotulo="E-mail"
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

            <div className="login-tela__linha">
              <label className="login-tela__manter">
                <input
                  type="checkbox"
                  className="login-tela__manter-input"
                  checked={manterConectado}
                  onChange={(evento) => setManterConectado(evento.target.checked)}
                />
                <span className="login-tela__manter-caixa" aria-hidden="true">
                  <Icone nome="check" tamanho={12} />
                </span>
                <span>Manter conectado</span>
              </label>
              <Link to="/cadastro" className="login-tela__esqueci">
                Esqueci minha senha
              </Link>
            </div>

            <Button type="submit" larguraTotal carregando={carregando}>
              Entrar no painel
              <Icone nome="seta-direita" tamanho={16} />
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
            Continuar com Google
          </button>

          <p className="login-tela__cadastro">
            Novo por aqui? <Link to="/cadastro">Criar conta</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
