import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";

import { AppLayout } from "./components/AppLayout";
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

interface RotaPrivadaProps {
  readonly titulo: string;
  readonly subtitulo?: string;
  readonly comCta?: boolean;
  readonly children: ReactNode;
}

function RotaPrivada({
  titulo,
  subtitulo,
  comCta,
  children,
}: RotaPrivadaProps): ReactNode {
  return (
    <PrivateRoute>
      <AppLayout titulo={titulo} subtitulo={subtitulo} comCta={comCta}>
        {children}
      </AppLayout>
    </PrivateRoute>
  );
}

export default function App(): ReactNode {
  return (
    <Suspense fallback={<Spinner rotulo="Carregando página…" />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        <Route
          path="/"
          element={
            <RotaPrivada titulo="Início" subtitulo="Visão geral da sua unidade">
              <Home />
            </RotaPrivada>
          }
        />
        <Route
          path="/registrar"
          element={
            <RotaPrivada
              titulo="Registrar ocorrência"
              subtitulo="Passo 1 de 2 — foto e detalhes"
              comCta={false}
            >
              <Registrar />
            </RotaPrivada>
          }
        />
        <Route
          path="/ocorrencias"
          element={
            <RotaPrivada
              titulo="Ocorrências"
              subtitulo="Todo o histórico de resíduos da sua unidade"
            >
              <Ocorrencias />
            </RotaPrivada>
          }
        />
        <Route
          path="/ocorrencias/:id"
          element={
            <RotaPrivada
              titulo="Detalhe da ocorrência"
              subtitulo="Acompanhamento e ações do responsável"
            >
              <OcorrenciaDetalhe />
            </RotaPrivada>
          }
        />
        <Route
          path="/cooperativas"
          element={
            <RotaPrivada
              titulo="Cooperativas"
              subtitulo="Parceiras próximas da sua unidade"
            >
              <Cooperativas />
            </RotaPrivada>
          }
        />
        <Route
          path="/cooperativas/:id/chat"
          element={
            <RotaPrivada
              titulo="Chat com cooperativa"
              subtitulo="Parceiras próximas da sua unidade"
              comCta={false}
            >
              <ChatCooperativa />
            </RotaPrivada>
          }
        />
        <Route
          path="/perfil"
          element={
            <RotaPrivada
              titulo="Perfil"
              subtitulo="Seus dados e unidade"
              comCta={false}
            >
              <Perfil />
            </RotaPrivada>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
