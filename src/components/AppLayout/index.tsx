import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { AssistenteVolta } from "../AssistenteVolta";
import { BuscaRapida } from "../BuscaRapida";
import { Sidebar } from "../Sidebar";
import { Topbar } from "../Topbar";
import "./styles.css";

interface AppLayoutProps {
  readonly titulo: string;
  readonly subtitulo?: string;
  readonly comCta?: boolean;
  readonly comBusca?: boolean;
  readonly children: ReactNode;
}

export function AppLayout({
  titulo,
  subtitulo,
  comCta = true,
  comBusca = true,
  children,
}: AppLayoutProps): ReactNode {
  const [assistenteAberto, setAssistenteAberto] = useState<boolean>(false);
  const [buscaAberta, setBuscaAberta] = useState<boolean>(false);

  useEffect(() => {
    if (!comBusca) return;
    function aoTeclar(evento: KeyboardEvent): void {
      const foiCtrlK =
        (evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "k";
      if (foiCtrlK) {
        evento.preventDefault();
        setBuscaAberta(true);
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [comBusca]);

  return (
    <div className="app-shell">
      <Sidebar aoAbrirAssistente={() => setAssistenteAberto(true)} />
      <div className="app-body">
        <Topbar
          titulo={titulo}
          subtitulo={subtitulo}
          comCta={comCta}
          comBusca={comBusca}
          aoAbrirAssistente={() => setAssistenteAberto(true)}
          aoAbrirBusca={() => setBuscaAberta(true)}
        />
        <main id="conteudo" className="app-main" tabIndex={-1}>
          {children}
        </main>
      </div>

      {assistenteAberto ? (
        <AssistenteVolta aoFechar={() => setAssistenteAberto(false)} />
      ) : null}
      {buscaAberta ? <BuscaRapida aoFechar={() => setBuscaAberta(false)} /> : null}
    </div>
  );
}
