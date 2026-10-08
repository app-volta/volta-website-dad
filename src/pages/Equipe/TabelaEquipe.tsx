import type { ReactNode } from "react";

import type { MembroEquipe } from "../../types/equipe";
import {
  formatarAtividade,
  iniciais,
  ROTULOS_PAPEL,
} from "../../utils/equipe";
import { MenuAcoes } from "./MenuAcoes";
import type { ItemMenuAcao } from "./MenuAcoes";

interface TabelaEquipeProps {
  readonly membros: readonly MembroEquipe[];
  /** Maior número de registros da equipe, que define a barra cheia. */
  readonly maiorRegistro: number;
  readonly aoCopiarEmail: (membro: MembroEquipe) => void;
  readonly aoReenviarConvite: (membro: MembroEquipe) => void;
  readonly aoCancelarConvite: (membro: MembroEquipe) => void;
}

export function TabelaEquipe({
  membros,
  maiorRegistro,
  aoCopiarEmail,
  aoReenviarConvite,
  aoCancelarConvite,
}: TabelaEquipeProps): ReactNode {
  function itensDoMenu(membro: MembroEquipe): readonly ItemMenuAcao[] {
    if (membro.convitePendente) {
      return [
        { rotulo: "Reenviar convite", aoClicar: () => aoReenviarConvite(membro) },
        {
          rotulo: "Cancelar convite",
          aoClicar: () => aoCancelarConvite(membro),
          perigo: true,
        },
      ];
    }
    return [{ rotulo: "Copiar e-mail", aoClicar: () => aoCopiarEmail(membro) }];
  }

  return (
    <div className="eq__tabela-card">
      <div
        className="eq__rolagem"
        role="region"
        aria-label="Tabela da equipe"
        tabIndex={0}
      >
        <table className="eq__tabela">
          <caption className="sr-only">Pessoas da unidade e convites enviados</caption>
          <thead>
            <tr>
              <th scope="col">Pessoa</th>
              <th scope="col">Papel</th>
              <th scope="col">Setor</th>
              <th scope="col">Registros no mês</th>
              <th scope="col">Última atividade</th>
              <th scope="col">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {membros.map((membro) => (
              <tr key={membro.id}>
                <td>
                  <div className="eq__pessoa">
                    <span
                      className={`eq__avatar${membro.convitePendente ? " eq__avatar--pendente" : ""}`}
                      aria-hidden="true"
                    >
                      {iniciais(membro.nome)}
                    </span>
                    <div>
                      <p className="eq__nome">{membro.nome}</p>
                      <p className="eq__email">{membro.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`eq__papel eq__papel--${membro.papel}`}>
                    {ROTULOS_PAPEL[membro.papel]}
                  </span>
                </td>
                <td className="eq__setor">{membro.setor ?? "—"}</td>
                <td>
                  <div className="eq__registros">
                    <span className="eq__trilho" aria-hidden="true">
                      <span
                        style={{
                          width: `${maiorRegistro > 0 ? (membro.registrosNoMes / maiorRegistro) * 100 : 0}%`,
                        }}
                      />
                    </span>
                    <b>{membro.registrosNoMes}</b>
                  </div>
                </td>
                <td className="eq__atividade">
                  {membro.ultimaAtividade ? (
                    formatarAtividade(membro.ultimaAtividade)
                  ) : (
                    <span className="eq__selo-convite">Convite enviado</span>
                  )}
                </td>
                <td className="eq__acoes">
                  <MenuAcoes
                    rotulo={`Ações para ${membro.nome}`}
                    itens={itensDoMenu(membro)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
