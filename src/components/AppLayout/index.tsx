import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";

import { AssistenteVolta } from "../AssistenteVolta";
import { BuscaRapida } from "../BuscaRapida";
import { Rodape } from "../Rodape";
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

/**
 * Casca das telas internas: barra lateral, topo, conteúdo principal (`<main>`) e rodapé.
 * Também abre o assistente VOLTA e a busca rápida, que responde a Ctrl K quando `comBusca` está ligado.
 */
export function AppLayout({
  titulo,
  subtitulo,
  comCta = true,
  comBusca = true,
  children,
}: AppLayoutProps): ReactNode {
  const [assistenteAberto, setAssistenteAberto] = useState<boolean>(false);
  const [buscaAberta, setBuscaAberta] = useState<boolean>(false);
  const idAssistente = useId();
  const idBusca = useId();

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
      <Sidebar
        aoAbrirAssistente={() => setAssistenteAberto(true)}
        assistenteAberto={assistenteAberto}
        idAssistente={idAssistente}
      />
      <div className="app-body">
        <Topbar
          titulo={titulo}
          subtitulo={subtitulo}
          comCta={comCta}
          comBusca={comBusca}
          aoAbrirAssistente={() => setAssistenteAberto(true)}
          aoAbrirBusca={() => setBuscaAberta(true)}
          assistenteAberto={assistenteAberto}
          idAssistente={idAssistente}
          buscaAberta={buscaAberta}
          idBusca={idBusca}
        />
        <main id="conteudo" className="app-main" tabIndex={-1}>
          {children}
        </main>
        <Rodape />
      </div>

      {assistenteAberto ? (
        <AssistenteVolta
          id={idAssistente}
          aoFechar={() => setAssistenteAberto(false)}
        />
      ) : null}
      {buscaAberta ? (
        <BuscaRapida id={idBusca} aoFechar={() => setBuscaAberta(false)} />
      ) : null}
    </div>
  );
}
