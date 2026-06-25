// Importamos useState para manejar estados del formulario.
import { useState } from "react";

// Importamos useNavigate para redirigir después del login.
import { useNavigate } from "react-router-dom";

// Importamos la función que consume POST /api/login.
import { loginRequest } from "../api/authApi";

// Importamos los estilos de la pantalla.
import "../styles/LoginPage.css";

function LoginPage() {
  // Hook para navegar entre rutas.
  const navigate = useNavigate();

  // Estado para guardar el email del formulario.
  const [email, setEmail] = useState("");

  // Estado para guardar la contraseña del formulario.
  const [password, setPassword] = useState("");

  // Estado para mostrar mensajes de error.
  const [errorMessage, setErrorMessage] = useState("");

  // Estado para bloquear el botón mientras se procesa el login.
  const [isLoading, setIsLoading] = useState(false);

  // Función auxiliar para obtener el rol aunque el backend lo mande de diferentes formas.
  const getRoleFromResponse = (data) => {
    // Mapa de roles según los role_id que usamos en el backend.
    const roleMap = {
      1: "admin",
      2: "tutor",
      3: "support",
      4: "student",
    };

    // Caso 1: el backend manda directamente role: "admin".
    if (typeof data.role === "string") {
      return data.role;
    }

    // Caso 2: el backend manda role como objeto, por ejemplo role: { name: "admin" }.
    if (data.role?.name) {
      return data.role.name;
    }

    // Caso 3: el backend manda el rol dentro del usuario, por ejemplo user.role.name.
    if (data.user?.role?.name) {
      return data.user.role.name;
    }

    // Caso 4: el backend manda user.role como texto.
    if (typeof data.user?.role === "string") {
      return data.user.role;
    }

    // Caso 5: el backend manda role_name.
    if (data.user?.role_name) {
      return data.user.role_name;
    }

    // Caso 6: el backend solo manda role_id.
    if (data.user?.role_id) {
      return roleMap[data.user.role_id] || "unknown";
    }

    // Si no encontramos rol, regresamos unknown para evitar undefined.
    return "unknown";
  };

  // Función que se ejecuta cuando el usuario envía el formulario.
  const handleSubmit = async (event) => {
    // Evita que el navegador recargue la página.
    event.preventDefault();

    // Limpiamos errores previos.
    setErrorMessage("");

    // Activamos el estado de carga.
    setIsLoading(true);

    try {
      // Enviamos las credenciales al backend.
      const data = await loginRequest({
        email,
        password,
      });

      // Obtenemos el rol normalizado.
      const userRole = getRoleFromResponse(data);

      // Guardamos el token para futuras peticiones protegidas.
      localStorage.setItem("mindia_token", data.token);

      // Guardamos la información del usuario.
      localStorage.setItem("mindia_user", JSON.stringify(data.user));

      // Guardamos el rol ya corregido.
      localStorage.setItem("mindia_role", userRole);

      // Mostramos en consola la respuesta real para depuración.
      console.log("Login correcto:", data);
      console.log("Rol detectado:", userRole);

      // Redirigimos al dashboard temporal.
      navigate("/dashboard");
    } catch (error) {
      // Tomamos el mensaje del backend si existe.
      const backendMessage =
        error.response?.data?.message || "No se pudo iniciar sesión.";

      // Mostramos el error en pantalla.
      setErrorMessage(backendMessage);

      // También lo mandamos a consola para depuración.
      console.error("Error en login:", error.response?.data || error.message);
    } finally {
      // Quitamos el estado de carga.
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-header">
          <h1>MindIA</h1>
          <p>Inicio de sesión institucional</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>

            <input
              id="email"
              type="email"
              placeholder="admin@mindia.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>

            <input
              id="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {/* Solo mostramos el mensaje de error si existe */}
          {errorMessage && <p className="login-error">{errorMessage}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="login-demo">
          <p>Usuario de prueba:</p>
          <span>admin@mindia.com / password123</span>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;