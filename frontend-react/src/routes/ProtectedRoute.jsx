// Importamos Navigate para redirigir usuarios cuando no cumplen una condición.
import { Navigate } from "react-router-dom";

/*
  ProtectedRoute

  Protege rutas privadas del panel web.
  Valida:
  1. Que exista token.
  2. Que exista rol.
  3. Que el rol tenga permiso para entrar a la ruta solicitada.
*/
function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("mindia_token");
  const storedRole = localStorage.getItem("mindia_role");
  const role = String(storedRole || "").trim().toLowerCase();

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
