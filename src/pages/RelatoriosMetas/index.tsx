import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Alerta } from "../../components/Alerta";
import { EstadoSemAcesso } from "../../components/EstadoSemAcesso";
import { SkeletonList } from "../../components/SkeletonList";
import { useAuth } from "../../context/AuthContext";
import { useConfiguracoes } from "../../hooks/useConfiguracoes";
import { useDadosReais } from "../../hooks/useModo";
import { useOcorrencias } from "../../hooks/useOcorrencias";
import { usePainel } from "../../hooks/usePainel";
import type { MetasSalvas } from "../../types/configuracao";
import { chaveDoMes, metaDoDiaKg, recuperadoHojeKg } from "../../utils/metas";
import { FormularioDeMetas } from "./FormularioDeMetas";
import type { ValoresDeMetas } from "./FormularioDeMetas";
import "./styles.css";

/**
 * Metas do mês e do dia (Relatórios). A meta do mês vai para a volta-api
 * (PUT /goals); a API não tem a meta do dia nem os dias de operação, então essas
 * duas escolhas ficam neste navegador, junto das outras preferências.
 */
export default function RelatoriosMetas(): ReactNode {
  const { usuario } = useAuth();
  const dadosReais = useDadosReais();
  const navegar = useNavigate();
  const { dados, carregando, erro, atualizar, limparErro } = useConfiguracoes();
  // Uma só busca das ocorrências serve ao número do mês e ao de hoje.
  const { dados: ocorrencias } = useOcorrencias();
  const { painel } = usePainel(ocorrencias);
  const [agora] = useState<Date>(() => new Date());
  const [salvando, setSalvando] = useState<boolean>(false);

  const podeDefinir =
    !dadosReais || usuario?.perfil === "ADMIN" || usuario?.perfil === "MANAGER";
  if (!podeDefinir) return <EstadoSemAcesso />;

  async function salvar(valores: ValoresDeMetas): Promise<void> {
    if (!dados) return;
    setSalvando(true);
    limparErro();
    const metaMudou = valores.metaMensalKg !== Math.round(dados.metaRecuperacaoKg);
    const plano = { modo: valores.modo, valorFixoKg: valores.valorFixoKg };
    const salvou = await atualizar({
      // Sem mexer na meta do mês, não há por que chamar a API.
      ...(metaMudou ? { metaRecuperacaoKg: valores.metaMensalKg } : {}),
      diasDeOperacao: { mes: chaveDoMes(agora), dias: valores.dias },
      metaDoDia: plano,
      metaPorMaterial: valores.metaPorMaterial,
      avisosDaMeta: valores.avisos,
    });
    if (!salvou) {
      setSalvando(false);
      return;
    }
    const metas: MetasSalvas = {
      mesKg: valores.metaMensalKg,
      diaKg: metaDoDiaKg(valores.metaMensalKg, valores.dias, plano),
    };
    navegar("/relatorios", { state: { metasSalvas: metas } });
  }

  if (!dados) {
    return carregando ? (
      <SkeletonList quantidade={3} rotulo="Carregando metas" />
    ) : (
      <Alerta
        variante="erro"
        titulo="Não foi possível carregar as metas"
        acao={<Link to="/relatorios">Voltar pros relatórios</Link>}
      >
        {erro}
      </Alerta>
    );
  }

  return (
    <FormularioDeMetas
      configuracoes={dados}
      agora={agora}
      recuperadoMesKg={painel.recuperadoMesKg}
      recuperadoHojeKg={recuperadoHojeKg(ocorrencias ?? [], agora)}
      recuperadoPorMaterial={painel.porMaterial}
      outrosKg={painel.outrosKg}
      salvando={salvando}
      erroDoServidor={erro}
      aoSalvar={(valores) => void salvar(valores)}
    />
  );
}
