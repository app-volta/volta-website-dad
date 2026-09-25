import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Alerta } from "../../components/Alerta";
import { Button } from "../../components/Button";
import { FiltroTabs } from "../../components/FiltroTabs";
import type { OpcaoAba } from "../../components/FiltroTabs";
import { OcorrenciaCard } from "../../components/OcorrenciaCard";
import { SkeletonList } from "../../components/SkeletonList";
import { useOcorrencias } from "../../hooks/useOcorrencias";
import { MATERIAIS, METADADOS_MATERIAL } from "../../types/material";
import type { Material } from "../../types/material";
import type { Ocorrencia } from "../../types/ocorrencia";
import "./styles.css";

type FiltroSelecionado = "todos" | Material;

export default function Ocorrencias(): ReactNode {
  const [chaveRecarga, setChaveRecarga] = useState<number>(0);
  const [filtro, setFiltro] = useState<FiltroSelecionado>("todos");
  const { dados, carregando, erro } = useOcorrencias(chaveRecarga);

  const filtrarPorMaterial = useCallback(
    (lista: readonly Ocorrencia[]): readonly Ocorrencia[] => {
      if (filtro === "todos") return lista;
      return lista.filter((item) => item.material === filtro);
    },
    [filtro],
  );

  const ocorrencias = useMemo(
    () => filtrarPorMaterial(dados ?? []),
    [dados, filtrarPorMaterial],
  );

  const opcoes = useMemo<readonly OpcaoAba[]>(() => {
    const contagens: Record<FiltroSelecionado, number> = {
      todos: dados?.length ?? 0,
      papelao: 0,
      plastico: 0,
      metal: 0,
      vidro: 0,
    };
    for (const item of dados ?? []) {
      if (item.material) contagens[item.material] += 1;
    }
    return [
      { valor: "todos", rotulo: "Todas", quantidade: contagens.todos },
      ...MATERIAIS.map((material) => ({
        valor: material,
        rotulo: METADADOS_MATERIAL[material].rotulo,
        quantidade: contagens[material],
      })),
    ];
  }, [dados]);

  return (
    <section aria-labelledby="titulo-ocorrencias">
      <div className="ocorrencias__cabecalho">
        <div>
          <h1 id="titulo-ocorrencias">Ocorrências</h1>
          <p className="ocorrencias__descricao">
            Filtre por material para focar em cada fluxo de destinação.
          </p>
        </div>
        <Button
          variante="secundario"
          onClick={() => setChaveRecarga((v) => v + 1)}
          aria-label="Recarregar ocorrências"
        >
          Atualizar
        </Button>
      </div>

      <div className="ocorrencias__filtros">
        <FiltroTabs
          opcoes={opcoes}
          selecionada={filtro}
          onMudar={(valor) => setFiltro(valor as FiltroSelecionado)}
          rotuloLista="Filtrar ocorrências por material"
        />
      </div>

      {erro ? (
        <Alerta
          variante="erro"
          titulo="Não foi possível carregar"
          acao={
            <button
              type="button"
              onClick={() => setChaveRecarga((v) => v + 1)}
              className="ocorrencias__link"
            >
              Tentar novamente
            </button>
          }
        >
          {erro}
        </Alerta>
      ) : null}

      {carregando ? (
        <SkeletonList quantidade={4} rotulo="Carregando ocorrências" />
      ) : ocorrencias.length > 0 ? (
        <div className="ocorrencias__lista">
          {ocorrencias.map((item) => (
            <OcorrenciaCard key={item.id} ocorrencia={item} />
          ))}
        </div>
      ) : !erro ? (
        <p className="lista-vazia">
          Nenhuma ocorrência{" "}
          {filtro === "todos"
            ? "registrada até o momento."
            : `de ${METADADOS_MATERIAL[filtro].rotulo.toLowerCase()} no filtro atual.`}
        </p>
      ) : null}
    </section>
  );
}
