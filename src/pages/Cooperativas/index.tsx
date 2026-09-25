import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Alerta } from "../../components/Alerta";
import { CooperativaCard } from "../../components/CooperativaCard";
import { FiltroTabs } from "../../components/FiltroTabs";
import type { OpcaoAba } from "../../components/FiltroTabs";
import { SkeletonList } from "../../components/SkeletonList";
import { useCooperativas } from "../../hooks/useCooperativas";
import { MATERIAIS, METADADOS_MATERIAL } from "../../types/material";
import type { Material } from "../../types/material";
import "./styles.css";

type FiltroCooperativa = "todos" | Material;

export default function Cooperativas(): ReactNode {
  const { dados, carregando, erro } = useCooperativas();
  const [filtro, setFiltro] = useState<FiltroCooperativa>("todos");

  const opcoes = useMemo<readonly OpcaoAba[]>(() => {
    const contagens: Record<FiltroCooperativa, number> = {
      todos: dados?.length ?? 0,
      papelao: 0,
      plastico: 0,
      metal: 0,
      vidro: 0,
    };
    for (const cooperativa of dados ?? []) {
      for (const material of cooperativa.materiaisAceitos) {
        contagens[material] += 1;
      }
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

  const cooperativasFiltradas = useMemo(() => {
    if (!dados) return [];
    if (filtro === "todos") return dados;
    return dados.filter((c) => c.materiaisAceitos.includes(filtro));
  }, [dados, filtro]);

  return (
    <section aria-labelledby="titulo-cooperativas">
      <h1 id="titulo-cooperativas">Cooperativas parceiras</h1>
      <p className="cooperativas__descricao">
        Parceiros aptos a receber resíduos classificados pela IA.
      </p>

      <div className="cooperativas__filtros">
        <FiltroTabs
          opcoes={opcoes}
          selecionada={filtro}
          onMudar={(valor) => setFiltro(valor as FiltroCooperativa)}
          rotuloLista="Filtrar cooperativas por material"
        />
      </div>

      {erro ? (
        <Alerta variante="erro" titulo="Não foi possível carregar">
          {erro}
        </Alerta>
      ) : null}

      {carregando ? (
        <SkeletonList quantidade={4} rotulo="Carregando cooperativas" />
      ) : cooperativasFiltradas.length > 0 ? (
        <div className="cooperativas__lista">
          {cooperativasFiltradas.map((cooperativa) => (
            <CooperativaCard
              key={cooperativa.id}
              cooperativa={cooperativa}
            />
          ))}
        </div>
      ) : !erro ? (
        <p className="lista-vazia">
          Nenhuma cooperativa disponível para o filtro atual.
        </p>
      ) : null}
    </section>
  );
}
