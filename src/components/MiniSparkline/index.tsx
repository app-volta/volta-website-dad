import type { ReactNode } from "react";

interface MiniSparklineProps {
  readonly pontos: readonly number[];
  readonly largura?: number;
  readonly altura?: number;
  readonly cor?: string;
  readonly comArea?: boolean;
  readonly rotulo?: string;
}

export function MiniSparkline({
  pontos,
  largura = 120,
  altura = 36,
  cor = "var(--verde-primario)",
  comArea = true,
  rotulo = "Tendência",
}: MiniSparklineProps): ReactNode {
  if (pontos.length < 2) return null;

  const maximo = Math.max(...pontos);
  const minimo = Math.min(...pontos);
  const variacao = maximo - minimo || 1;

  const passo = largura / (pontos.length - 1);
  const padding = 2;
  const alturaUtil = altura - padding * 2;

  const coords = pontos.map((valor, idx) => {
    const x = idx * passo;
    const y = padding + alturaUtil - ((valor - minimo) / variacao) * alturaUtil;
    return { x, y };
  });

  const linha = coords
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const area = `${linha} L ${largura} ${altura} L 0 ${altura} Z`;

  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      width={largura}
      height={altura}
      role="img"
      aria-label={rotulo}
    >
      {comArea ? (
        <path d={area} fill={cor} opacity="0.12" />
      ) : null}
      <path d={linha} stroke={cor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="2.5" fill={cor} />
    </svg>
  );
}
