// Importamos useNavigate para poder regresar al login.
import { useNavigate } from "react-router-dom";

function UnauthorizedPage() {
  // Hook para navegar entre rutas.
  const navigate = useNavigate();

  // Función para cerrar sesión localmente y regresar al login.
  const handleBackToLogin = () => {
    // Eliminamos los datos guardados de sesión.
    localStorage.removeItem("mindia_token");
    localStorage.removeItem("mindia_user");
    localStorage.removeItem("mindia_role");

    // Redirigimos al login.
    navigate("/login");
  };

  return (
    <main style={{ padding: "40px", fontFamily: "Arial", textAlign: "center" }}>
      <h1>Acceso denegado</h1>

      <p>
        Tu usuario no tiene permisos para acceder a esta sección del sistema.
      </p>

      <button onClick={handleBackToLogin}>
        Regresar al login
      </button>
    </main>
  );
}

export default UnauthorizedPage;