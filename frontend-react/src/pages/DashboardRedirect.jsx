// Importamos useEffect para ejecutar la redirección al cargar la pantalla.
import { useEffect } from "react";

// Importamos useNavigate para mover al usuario a la ruta correcta.
import { useNavigate } from "react-router-dom";

function DashboardRedirect() {
  // Hook para navegar entre rutas.
  const navigate = useNavigate();

  // Obtenemos el token guardado en el login.
  const token = localStorage.getItem("mindia_token");

  // Obtenemos el rol detectado en el login.
  const role = localStorage.getItem("mindia_role");

  useEffect(() => {
    // Si no hay token, no existe sesión activa.
    if (!token) {
      navigate("/login");
      return;
    }

    // Redirigimos según el rol del usuario.
    // Esto permite mandar cada usuario a su dashboard correspondiente.
    if (role === "admin") {
      navigate("/admin/dashboard");
      return;
    }

    if (role === "tutor") {
      navigate("/tutor/dashboard");
      return;
    }

    if (role === "support") {
      navigate("/support/dashboard");
      return;
    }

    if (role === "student") {
      navigate("/student/dashboard");
      return;
    }

    // Si el rol no coincide con ninguno esperado,
    // mandamos al usuario a acceso denegado.
    navigate("/unauthorized");
  }, [token, role, navigate]);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Redirigiendo...</h1>
      <p>Estamos enviando tu sesión al panel correspondiente.</p>
    </main>
  );
}

export default DashboardRedirect;