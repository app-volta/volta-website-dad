import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Route, Routes, useParams } from "react-router-dom";

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
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Equipe = lazy(() => import("./pages/Equipe"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const NotFound = lazy(() => import("./pages/NotFound"));

interface RotaPrivadaProps {
  readonly titulo: string;
  readonly subtitulo?: string;
  readonly comCta?: boolean;
  readonly comBusca?: boolean;
  readonly children: ReactNode;
}

function RotaPrivada({
  titulo,
  subtitulo,
  comCta,
  comBusca,
  children,
}: RotaPrivadaProps): ReactNode {
  return (
    <PrivateRoute>
      <AppLayout
        titulo={titulo}
        subtitulo={subtitulo}
        comCta={comCta}
        comBusca={comBusca}
      >
        {children}
      </AppLayout>
    </PrivateRoute>
  );
}

function RotaDetalheOcorrencia(): ReactNode {
  const { id } = useParams();
  return (
    <RotaPrivada
      titulo={`Ocorrência #${(id ?? "").replace(/\D/g, "")}`}
      subtitulo="Revisão e ações do responsável"
    >
      <OcorrenciaDetalhe />
    </RotaPrivada>
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
              subtitulo="Foto, detalhes e análise da IA"
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
              subtitulo="Tudo que a unidade registrou — aprove, encaminhe ou recuse"
            >
              <Ocorrencias />
            </RotaPrivada>
          }
        />
        <Route path="/ocorrencias/:id" element={<RotaDetalheOcorrencia />} />
        <Route
          path="/cooperativas"
          element={
            <RotaPrivada
              titulo="Cooperativas"
              subtitulo="Parcerias, homologação e licenças ambientais"
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
              comBusca={false}
            >
              <ChatCooperativa />
            </RotaPrivada>
          }
        />
        <Route
          path="/relatorios"
          element={
            <RotaPrivada
              titulo="Relatórios PGRS"
              subtitulo="Indicadores e relatório do plano de resíduos"
            >
              <Relatorios />
            </RotaPrivada>
          }
        />
        <Route
          path="/equipe"
          element={
            <RotaPrivada
              titulo="Equipe"
              subtitulo="Quem registra, revisa e aprova na unidade"
            >
              <Equipe />
            </RotaPrivada>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <RotaPrivada
              titulo="Configurações"
              subtitulo="Seu perfil, a unidade e as metas"
            >
              <Configuracoes />
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
              comBusca={false}
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
