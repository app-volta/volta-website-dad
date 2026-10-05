import type { ReactNode } from "react";

import type { StatusOcorrencia } from "../../types/ocorrencia";
import { ROTULOS_STATUS } from "../../types/ocorrencia";

interface StatusBadgeProps {
  readonly status: StatusOcorrencia;
}

const CORES: Readonly<
  Record<StatusOcorrencia, { readonly bg: string; readonly fg: string }>
> = {
  aguardando_classificacao: { bg: "#fff3cd", fg: "#5a4300" },
  classificada: { bg: "#fdf3de", fg: "#c68a10" },
  aprovada: { bg: "#d3ebd9", fg: "#0e7c48" },
  encaminhada: { bg: "#cfe0ff", fg: "#0b2b6b" },
  recusada: { bg: "#fdeaec", fg: "#e8556c" },
  finalizada: { bg: "#e0e0e0", fg: "#2a2a2a" },
};

export function StatusBadge({ status }: StatusBadgeProps): ReactNode {
  const cor = CORES[status];
  return (
    <span
      className="chip"
      style={{ background: cor.bg, color: cor.fg }}
      aria-label={`Status: ${ROTULOS_STATUS[status]}`}
    >
      {ROTULOS_STATUS[status]}
    </span>
  );
}
