import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { EstadoForaDoAr } from "../../components/EstadoForaDoAr";
import { Icone } from "../../components/Icone";
import { Spinner } from "../../components/Spinner";
import { useAuth } from "../../context/AuthContext";
import { useConfiguracoes } from "../../hooks/useConfiguracoes";
import { useCooperativas } from "../../hooks/useCooperativas";
import { useMetaRecuperacao } from "../../hooks/useMeta";
import { useRelatorio } from "../../hooks/useRelatorio";
import { PERIODOS_RELATORIO } from "../../types/relatorio";
import type { PeriodoRelatorio } from "../../types/relatorio";
import { montarDocumentoPgrs } from "../../utils/documentoPgrs";
import { rotuloDoPapel } from "../../utils/pessoa";
import { DocumentoPgrs } from "./DocumentoPgrs";
import "./styles.css";

/** O período vem do endereço (`?periodo=trimestre`); qualquer outro valor cai no mês. */
function periodoDoEndereco(valor: string | null): PeriodoRelatorio {
  return PERIODOS_RELATORIO.find((periodo) => periodo === valor) ?? "mes";
}

/**
 * O relatório PGRS como documento A4. A pessoa o vê na tela e salva em PDF pelo
 * "Imprimir" do navegador (destino "Salvar como PDF"): a impressão leva só o
 * documento, em duas páginas, com as cores e as fontes do modelo.
 */
export default function RelatorioPgrsPagina(): ReactNode {
  const [parametros] = useSearchParams();
  const periodo = periodoDoEndereco(parametros.get("periodo"));
  const { usuario } = useAuth();
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const relatorio = useRelatorio(periodo, chaveRecarga);
  const configuracoes = useConfiguracoes();
  const cooperativas = useCooperativas();
  const metaMensalKg = useMetaRecuperacao();
  // A hora de emissão fica a mesma enquanto a página está aberta.
  const [agora] = useState<Date>(() => new Date());

  const documento = useMemo(
    () =>
      relatorio.dados
        ? montarDocumentoPgrs(relatorio.dados, {
            unidade: configuracoes.dados?.unidade ?? null,
            nomeDaUnidade: usuario?.unidade ?? "",
            responsavel: {
              nome: usuario?.nome ?? "",
              funcao: usuario ? rotuloDoPapel(usuario.papel) : "",
            },
            metaMensalKg,
            cooperativas: cooperativas.dados ?? [],
            agora,
          })
        : null,
    [relatorio.dados, configuracoes.dados, usuario, metaMensalKg, cooperativas.dados, agora],
  );

  // O navegador sugere o título da página como nome do PDF.
  const nomeDoArquivo = documento?.nomeDoArquivo;
  useEffect(() => {
    if (!nomeDoArquivo) return undefined;
    const anterior = document.title;
    document.title = nomeDoArquivo;
    return () => {
      document.title = anterior;
    };
  }, [nomeDoArquivo]);

  const preparando = relatorio.carregando || configuracoes.carregando || cooperativas.carregando;

  if (relatorio.erro && !relatorio.dados) {
    return (
      <main className="pgrs-tela">
        <EstadoForaDoAr aoTentarDeNovo={() => setChaveRecarga((valor) => valor + 1)} />
      </main>
    );
  }

  return (
    <main className="pgrs-tela">
      <header className="pgrs-tela__barra">
        <Link className="pgrs-tela__voltar" to="/relatorios">
          <Icone nome="seta-esquerda" tamanho={14} />
          Voltar aos relatórios
        </Link>
        <button
          type="button"
          className="pgrs-tela__salvar"
          onClick={() => window.print()}
          disabled={documento === null || preparando}
        >
          <Icone nome="download" tamanho={14} />
          Salvar como PDF
        </button>
      </header>
      <p className="pgrs-tela__dica">
        Na janela que abrir, escolha <strong>Salvar como PDF</strong> em Destino. As margens e as cores já
        saem como no modelo.
      </p>

      {documento && !preparando ? (
        <DocumentoPgrs documento={documento} />
      ) : (
        <Spinner rotulo="Montando o relatório…" />
      )}
    </main>
  );
}
