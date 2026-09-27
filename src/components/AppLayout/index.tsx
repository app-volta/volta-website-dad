import type { ReactNode } from "react";

import { Sidebar } from "../Sidebar";
import { Topbar } from "../Topbar";
import "./styles.css";

interface AppLayoutProps {
  readonly titulo: string;
  readonly subtitulo?: string;
  readonly comCta?: boolean;
  readonly children: ReactNode;
}

export function AppLayout({
  titulo,
  subtitulo,
  comCta = true,
  children,
}: AppLayoutProps): ReactNode {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-body">
        <Topbar titulo={titulo} subtitulo={subtitulo} comCta={comCta} />
        <main id="conteudo" className="app-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
