import type { ReactNode } from "react";

import { Icone } from "../../components/Icone";
import type { NomeIcone } from "../../components/Icone";
import { ROTULOS_MATERIAL_ACEITO } from "../../types/cooperativa";
import type { Cooperativa } from "../../types/cooperativa";
import { estadoLicenca, rotuloLicenca } from "../../utils/cooperativas";
import type { EstadoLicenca } from "../../utils/cooperativas";
import {
  formatarKg,
  formatarKmOpcional,
  formatarNota,
} from "../../utils/formatacao";
import { corDaCooperativa } from "./cores";

const MATERIAIS_VISIVEIS = 2;

const ICONE_LICENCA: Readonly<Record<EstadoLicenca, NomeIcone>> = {
  valida: "escudo",
  vencendo: "alerta",
  vencida: "alerta",
  em_analise: "relogio",
  sem_licenca: "relogio",
  nao_informada: "relogio",
};

interface TabelaCooperativasProps {
  readonly cooperativas: readonly Cooperativa[];
  readonly todas: readonly Cooperativa[];
  readonly selecionadaId: string | null;
  readonly aoSelecionar: (id: string) => void;
}

export function TabelaCooperativas({
  cooperativas,
  todas,
  selecionadaId,
  aoSelecionar,
}: TabelaCooperativasProps): ReactNode {
  if (cooperativas.length === 0) {
    return <p className="lista-vazia">Nenhuma cooperativa nesta situação.</p>;
  }

  return (
    <div className="coops__tabela-card">
      <div
        className="coops__rolagem"
        role="region"
        aria-label="Tabela de cooperativas"
        tabIndex={0}
      >
        <table className="coops__tabela">
          <caption className="sr-only">
            Cooperativas parceiras e em homologação
          </caption>
          <thead>
            <tr>
              <th scope="col">Cooperativa</th>
              <th scope="col">Materiais</th>
              <th scope="col">Capacidade usada</th>
              <th scope="col">Licença ambiental</th>
            </tr>
          </thead>
          <tbody>
            {cooperativas.map((coop) => (
              <Linha
                key={coop.id}
                coop={coop}
                cor={corDaCooperativa(coop.id, todas)}
                selecionada={coop.id === selecionadaId}
                aoSelecionar={aoSelecionar}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface LinhaProps {
  readonly coop: Cooperativa;
  readonly cor: string;
  readonly selecionada: boolean;
  readonly aoSelecionar: (id: string) => void;
}

function Linha({ coop, cor, selecionada, aoSelecionar }: LinhaProps): ReactNode {
  const estado = estadoLicenca(coop);
  const visiveis = coop.materiaisAceitos.slice(0, MATERIAIS_VISIVEIS);
  const restantes = coop.materiaisAceitos.length - visiveis.length;
  const percentual =
    coop.capacidadeMesKg === null || coop.capacidadeMesKg <= 0
      ? null
      : Math.min(100, Math.round((coop.usadoMesKg / coop.capacidadeMesKg) * 100));

  return (
    <tr
      className={`coops__linha${selecionada ? " coops__linha--selecionada" : ""}`}
    >
      <td>
        <div className="coops__ident">
          <span className="coops__logo" data-cor={cor} aria-hidden="true">
            <span />
          </span>
          <div>
            <button
              type="button"
              className="coops__nome"
              aria-current={selecionada ? "true" : undefined}
              onClick={() => aoSelecionar(coop.id)}
            >
              {coop.nome}
            </button>
            <p className="coops__sub">
              {coop.situacao === "em_homologacao" ? (
                <>
                  <span className="coops__sub-homologacao">Em homologação</span>
                  {coop.distanciaKm === null
                    ? ""
                    : ` · ${formatarKmOpcional(coop.distanciaKm)}`}
                </>
              ) : (
                <>
                  {[
                    coop.distanciaKm === null
                      ? null
                      : formatarKmOpcional(coop.distanciaKm),
                    coop.avaliacao === null
                      ? null
                      : `★ ${formatarNota(coop.avaliacao)}`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Sem avaliações"}
                </>
              )}
            </p>
            {coop.parceiraGrupo ? (
              <span className="coops__selo">Parceira J&amp;F</span>
            ) : null}
          </div>
        </div>
      </td>
      <td>
        <ul className="coops__materiais" aria-label="Materiais aceitos">
          {visiveis.map((material) => (
            <li key={material}>{ROTULOS_MATERIAL_ACEITO[material]}</li>
          ))}
          {restantes > 0 ? (
            <li aria-label={`mais ${restantes} materiais`}>+{restantes}</li>
          ) : null}
        </ul>
      </td>
      <td>
        <div className="coops__cap">
          <p className="coops__cap-texto">
            <span>{formatarKg(coop.usadoMesKg)}</span>
            <span>
              {coop.capacidadeMesKg === null
                ? "neste mês"
                : `de ${coop.capacidadeMesKg.toLocaleString("pt-BR")}`}
            </span>
          </p>
          {percentual === null ? null : (
            <div className="coops__cap-barra" aria-hidden="true">
              <span style={{ width: `${percentual}%` }} />
            </div>
          )}
        </div>
      </td>
      <td>
        <span className={`coops__lic coops__lic--${estado}`}>
          <Icone nome={ICONE_LICENCA[estado]} tamanho={14} />
          {rotuloLicenca(coop)}
        </span>
      </td>
    </tr>
  );
}
