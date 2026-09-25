import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

interface PrivateRouteProps {
  readonly children: ReactNode;
}

/**
 * Guarda de rota. A verificação vem exclusivamente do AuthContext — nenhuma
 * página checa autenticação por conta própria.
 */
export function PrivateRoute({ children }: PrivateRouteProps): ReactNode {
  const { sessao } = useAuth();
  const localizacao = useLocation();

  if (!sessao) {
    return (
      <Navigate to="/login" state={{ de: localizacao.pathname }} replace />
    );
  }

  return children;
}
