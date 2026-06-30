// Importamos useEffect para ejecutar la redirección al cargar la pantalla.
import { useEffect } from "react";

// Importamos useNavigate para mover al usuario a la ruta correcta.
import { useNavigate } from "react-router-dom";

/*
  DashboardRedirect

  Redirige al usuario autenticado al panel web que corresponde a su rol.
  En este MVP, el rol estudiante pertenece a la aplicación móvil en Flutter,
  por eso no se redirige a un dashboard web de estudiante.
*/
function DashboardRedirect() {
  const navigate = useNavigate();

  const token = localStorage.getItem("mindia_token");
  const role = String(localStorage.getItem("mindia_role") || "").toLowerCase();

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    if (role === "tutor") {
      navigate("/tutor/dashboard", { replace: true });
      return;
    }

    if (role === "support" || role === "support_staff") {
      navigate("/support/dashboard", { replace: true });
      return;
    }

    navigate("/unauthorized", { replace: true });
  }, [token, role, navigate]);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Redirigiendo...</h1>
      <p>Estamos enviando tu sesión al panel correspondiente.</p>
    </main>
  );
}

export default DashboardRedirect;
