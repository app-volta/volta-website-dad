import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import { Header } from "./components/Header";
import { PrivateRoute } from "./components/PrivateRoute";
import { Spinner } from "./components/Spinner";

const Login = lazy(() => import("./pages/Login"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const Home = lazy(() => import("./pages/Home"));
const Registrar = lazy(() => import("./pages/Registrar"));
const Ocorrencias = lazy(() => import("./pages/Ocorrencias"));
const OcorrenciaDetalhe = lazy(() => import("./pages/OcorrenciaDetalhe"));
const Cooperativas = lazy(() => import("./pages/Cooperativas"));
const ChatCooperativa = lazy(() => import("./pages/ChatCooperativa"));
const Perfil = lazy(() => import("./pages/Perfil"));
const NotFound = lazy(() => import("./pages/NotFound"));

function ProtegidaComShell({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <PrivateRoute>
      <>
        <Header />
        <main id="conteudo" className="app-main" tabIndex={-1}>
          {children}
        </main>
      </>
    </PrivateRoute>
  );
}

export default function App(): ReactNode {
  const localizacao = useLocation();
  const publica =
    localizacao.pathname === "/login" ||
    localizacao.pathname === "/cadastro";

  return (
    <div className="app-shell">
      <Suspense fallback={<Spinner rotulo="Carregando página…" />}>
        <Routes>
          {/* Rotas públicas — sem Header autenticado */}
          <Route
            path="/login"
            element={
              <main id="conteudo" className="app-main">
                <Login />
              </main>
            }
          />
          <Route
            path="/cadastro"
            element={
              <main id="conteudo" className="app-main">
                <Cadastro />
              </main>
            }
          />

          {/* Rotas privadas — shell com Header + main landmark */}
          <Route
            path="/"
            element={
              <ProtegidaComShell>
                <Home />
              </ProtegidaComShell>
            }
          />
          <Route
            path="/registrar"
            element={
              <ProtegidaComShell>
                <Registrar />
              </ProtegidaComShell>
            }
          />
          <Route
            path="/ocorrencias"
            element={
              <ProtegidaComShell>
                <Ocorrencias />
              </ProtegidaComShell>
            }
          />
          <Route
            path="/ocorrencias/:id"
            element={
              <ProtegidaComShell>
                <OcorrenciaDetalhe />
              </ProtegidaComShell>
            }
          />
          <Route
            path="/cooperativas"
            element={
              <ProtegidaComShell>
                <Cooperativas />
              </ProtegidaComShell>
            }
          />
          <Route
            path="/cooperativas/:id/chat"
            element={
              <ProtegidaComShell>
                <ChatCooperativa />
              </ProtegidaComShell>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtegidaComShell>
                <Perfil />
              </ProtegidaComShell>
            }
          />

          {/* Rota curinga — página 404 acessível sem autenticação */}
          <Route
            path="*"
            element={
              <main id="conteudo" className="app-main">
                <NotFound />
              </main>
            }
          />
        </Routes>
      </Suspense>
      {publica ? null : <FooterInstitucional />}
    </div>
  );
}

function FooterInstitucional(): ReactNode {
  return (
    <footer className="rodape" role="contentinfo">
      <p>
        © {new Date().getFullYear()} VOLTA — reciclagem industrial inteligente.
      </p>
    </footer>
  );
}
