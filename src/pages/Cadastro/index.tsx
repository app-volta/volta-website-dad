import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
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
      /* erro capturado no contexto */
    }
  }

  return (
    <section className="login" aria-labelledby="titulo-cadastro">
      <div className="login__cartao">
        <h1 id="titulo-cadastro" className="login__titulo">
          Criar conta VOLTA
        </h1>
        <p className="login__descricao">
          Vamos configurar seu acesso à plataforma de gestão de resíduos.
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
            ajuda="Mínimo de 6 caracteres."
          />
          <Input
            rotulo="Unidade"
            required
            value={formulario.unidade}
            onChange={(valor) =>
              setFormulario((atual) => ({ ...atual, unidade: valor }))
            }
            ajuda="Ex.: Frigorífico Lins/SP."
            erro={errosCampo.unidade}
          />
          <fieldset className="campo">
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
        <p className="login__rodape">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </section>
  );
}
