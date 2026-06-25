// Importamos Navigate para redirigir usuarios cuando no cumplen una condición.
import { Navigate } from "react-router-dom";

/*
  Componente ProtectedRoute

  Sirve para proteger rutas privadas.
  Valida tres cosas:
  1. Que exista token.
  2. Que exista rol.
  3. Que el rol del usuario esté permitido para entrar a esa ruta.
*/
function ProtectedRoute({ allowedRoles, children }) {
  // Obtenemos el token guardado después del login.
  const token = localStorage.getItem("mindia_token");

  // Obtenemos el rol guardado después del login.
  const role = localStorage.getItem("mindia_role");

  // Si no hay token, significa que el usuario no inició sesión.
  // Entonces lo mandamos al login.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si no hay rol, la sesión está incompleta o corrupta.
  // También lo mandamos al login.
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Si el rol del usuario no está dentro de los roles permitidos,
  // lo mandamos a la pantalla de acceso denegado.
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todo está correcto, mostramos la pantalla solicitada.
  return children;
}

export default ProtectedRoute;