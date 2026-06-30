// Importamos useNavigate para poder regresar al login.
import { useNavigate } from "react-router-dom";

function UnauthorizedPage() {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    localStorage.removeItem("mindia_token");
    localStorage.removeItem("mindia_user");
    localStorage.removeItem("mindia_role");

    navigate("/login");
  };

  return (
    <main style={{ padding: "40px", fontFamily: "Arial", textAlign: "center" }}>
      <h1>Acceso denegado</h1>

      <p>
        Tu usuario no tiene permisos para acceder a esta sección del sistema web.
      </p>

      <p>
        Si eres estudiante, tu acceso corresponde a la aplicación móvil de
        MindIA.
      </p>

      <button type="button" onClick={handleBackToLogin}>
        Regresar al login
      </button>
    </main>
  );
}

export default UnauthorizedPage;
