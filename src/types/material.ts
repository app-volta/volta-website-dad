export type Material = "papelao" | "plastico" | "metal" | "vidro";

export const MATERIAIS: readonly Material[] = [
  "papelao",
  "plastico",
  "metal",
  "vidro",
] as const;

export interface MetadadosMaterial {
  readonly rotulo: string;
  readonly corFundo: string;
  readonly corTexto: string;
  readonly emoji: string;
}

export const METADADOS_MATERIAL: Readonly<Record<Material, MetadadosMaterial>> =
  {
    papelao: {
      rotulo: "Papelão",
      corFundo: "var(--papelao-bg)",
      corTexto: "var(--papelao-fg)",
      emoji: "📦",
    },
    plastico: {
      rotulo: "Plástico",
      corFundo: "var(--plastico-bg)",
      corTexto: "var(--plastico-fg)",
      emoji: "🧴",
    },
    metal: {
      rotulo: "Metal",
      corFundo: "var(--metal-bg)",
      corTexto: "var(--metal-fg)",
      emoji: "🥫",
    },
    vidro: {
      rotulo: "Vidro",
      corFundo: "var(--vidro-bg)",
      corTexto: "var(--vidro-fg)",
      emoji: "🍾",
    },
  };

export function ehMaterial(valor: string): valor is Material {
  return (MATERIAIS as readonly string[]).includes(valor);
}
