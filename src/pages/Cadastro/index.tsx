import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { Icone } from "../../components/Icone";
import { Input } from "../../components/Input";
import { LogoVolta } from "../../components/LogoVolta";
import { useAuth } from "../../context/AuthContext";
import type { PapelUsuario } from "../../types/usuario";
import {
  combinar,
  validarEmail,
  validarObrigatorio,
  validarSenha,
} from "../../utils/validadores";
import "../Login/styles.css";
import "./styles.css";

interface FormularioCadastro {
  readonly nome: string;
  readonly email: string;
  readonly senha: string;
  readonly unidade: string;
  readonly papel: PapelUsuario;
}

export default function Cadastro(): ReactNode {
  const { cadastrarNovo, carregando, erro, limparErro, sessao } = useAuth();
  const navegar = useNavigate();

  const [formulario, setFormulario] = useState<FormularioCadastro>({
    nome: "",
    email: "",
    senha: "",
    unidade: "",
    papel: "operador",
  });
  const [errosCampo, setErrosCampo] = useState<Readonly<Record<string, string>>>(
    {},
  );

  useEffect(() => {
    if (sessao) navegar("/", { replace: true });
  }, [sessao, navegar]);

  async function tratarSubmit(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    limparErro();
    const validacao = combinar({
      nome: validarObrigatorio(formulario.nome, "nome completo", 80),
      email: validarEmail(formulario.email),
      senha: validarSenha(formulario.senha),
      unidade: validarObrigatorio(formulario.unidade, "unidade", 80),
    });
    setErrosCampo(validacao.erros);
    if (!validacao.valido) return;
    try {
      await cadastrarNovo(formulario);
    } catch {
      /* tratado no contexto */
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
            <h2 className="login-tela__hero-titulo">Comece agora.</h2>
            <p className="login-tela__hero-texto">
              Cadastre-se e ganhe visibilidade completa do PGRS da sua unidade
              em minutos.
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
          <h1 className="login-tela__titulo">Criar conta VOLTA</h1>
          <p className="login-tela__descricao">
            Configuramos seu acesso à plataforma em segundos.
          </p>

          {erro ? (
            <Alerta variante="erro" titulo="Cadastro não concluído">
              {erro}
            </Alerta>
          ) : null}

          <form onSubmit={tratarSubmit} noValidate>
            <Input
              rotulo="Nome completo"
              required
              autoComplete="name"
              value={formulario.nome}
              onChange={(valor) =>
                setFormulario((atual) => ({ ...atual, nome: valor }))
              }
              erro={errosCampo.nome}
            />
            <Input
              rotulo="E-mail corporativo"
              type="email"
              required
              autoComplete="email"
              value={formulario.email}
              onChange={(valor) =>
                setFormulario((atual) => ({ ...atual, email: valor }))
              }
              erro={errosCampo.email}
              iconeEsquerdo="mensagem"
            />
            <Input
              rotulo="Senha"
              type="password"
              required
              autoComplete="new-password"
              value={formulario.senha}
              onChange={(valor) =>
                setFormulario((atual) => ({ ...atual, senha: valor }))
              }
              erro={errosCampo.senha}
              iconeEsquerdo="cadeado"
              ajuda="Mínimo de 6 caracteres."
            />
            <Input
              rotulo="Unidade"
              required
              value={formulario.unidade}
              onChange={(valor) =>
                setFormulario((atual) => ({ ...atual, unidade: valor }))
              }
              iconeEsquerdo="pin"
              erro={errosCampo.unidade}
              ajuda="Ex.: Frigorífico Lins/SP."
            />
            <fieldset className="cadastro__papel">
              <legend className="campo__rotulo">Perfil de acesso</legend>
              <label className="cadastro__radio">
                <input
                  type="radio"
                  name="papel"
                  value="operador"
                  checked={formulario.papel === "operador"}
                  onChange={() =>
                    setFormulario((atual) => ({ ...atual, papel: "operador" }))
                  }
                />
                <span>Operador de chão de fábrica</span>
              </label>
              <label className="cadastro__radio">
                <input
                  type="radio"
                  name="papel"
                  value="responsavel_pgrs"
                  checked={formulario.papel === "responsavel_pgrs"}
                  onChange={() =>
                    setFormulario((atual) => ({
                      ...atual,
                      papel: "responsavel_pgrs",
                    }))
                  }
                />
                <span>Responsável PGRS</span>
              </label>
            </fieldset>

            <Button type="submit" larguraTotal carregando={carregando}>
              Criar conta
            </Button>
          </form>

          <p className="login-tela__cadastro">
            Já tem uma conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
