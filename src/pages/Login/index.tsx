import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
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
      // Erro já tratado no contexto (state.erro).
    }
  }

  return (
    <section className="login" aria-labelledby="titulo-login">
      <div className="login__cartao">
        <h1 id="titulo-login" className="login__titulo">
          Entrar no VOLTA
        </h1>
        <p className="login__descricao">
          Acesse o painel para acompanhar seus resíduos e o relatório PGRS
          automático.
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
            value={formulario.email}
            onChange={(valor) =>
              setFormulario((atual) => ({ ...atual, email: valor }))
            }
            erro={errosCampo.email}
          />
          <Input
            rotulo="Senha"
            type="password"
            autoComplete="current-password"
            required
            value={formulario.senha}
            onChange={(valor) =>
              setFormulario((atual) => ({ ...atual, senha: valor }))
            }
            erro={errosCampo.senha}
            ajuda="Mínimo de 6 caracteres."
          />
          <Button
            type="submit"
            larguraTotal
            carregando={carregando}
            aria-label="Entrar na conta"
          >
            Entrar
          </Button>
        </form>
        <p className="login__rodape">
          Ainda não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </div>
    </section>
  );
}
