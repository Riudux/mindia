// Importamos useState para manejar los estados del formulario.
import { useState } from "react";

// Importamos useNavigate para redirigir después del inicio de sesión.
import { useNavigate } from "react-router-dom";

// Importamos iconos visuales usados en el diseño del login.
import {
  BarChart3,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  PieChart,
} from "lucide-react";

// Importamos la función que consume POST /api/login.
import { loginRequest } from "../api/authApi";

// Importamos el logo institucional de MindIA.
import mindiaLogo from "../assets/mindia-logo.png";

// Importamos los estilos de la pantalla.
import "../styles/LoginPage.css";

function LoginPage() {
  // Hook para navegar entre rutas.
  const navigate = useNavigate();

  // Estado para guardar el correo institucional del formulario.
  const [email, setEmail] = useState("");

  // Estado para guardar la contraseña del formulario.
  const [password, setPassword] = useState("");

  // Estado visual para mostrar u ocultar la contraseña.
  const [showPassword, setShowPassword] = useState(false);

  // Estado visual del checkbox de recordar sesión.
  const [rememberMe, setRememberMe] = useState(true);

  // Estado para mostrar mensajes de error.
  const [errorMessage, setErrorMessage] = useState("");

  // Estado para bloquear el botón mientras se procesa el login.
  const [isLoading, setIsLoading] = useState(false);

  /*
    Obtiene el rol del usuario aunque el backend lo mande con estructuras distintas.

    Soporta respuestas como:
    - role: "admin"
    - role: { name: "admin" }
    - user.role.name
    - user.role_id
  */
  const getRoleFromResponse = (data) => {
    const roleMap = {
      1: "admin",
      2: "tutor",
      3: "support",
      4: "student",
    };

    if (typeof data.role === "string") {
      return data.role;
    }

    if (data.role?.name) {
      return data.role.name;
    }

    if (data.user?.role?.name) {
      return data.user.role.name;
    }

    if (typeof data.user?.role === "string") {
      return data.user.role;
    }

    if (data.user?.role_name) {
      return data.user.role_name;
    }

    if (data.user?.role_id) {
      return roleMap[data.user.role_id] || "unknown";
    }

    return "unknown";
  };

  /*
    Limpia los datos de sesión del navegador.

    Se usa cuando el usuario autenticado no debe entrar al panel web,
    por ejemplo estudiantes, ya que su acceso corresponde a la app móvil.
  */
  const clearLocalSession = () => {
    localStorage.removeItem("mindia_token");
    localStorage.removeItem("mindia_user");
    localStorage.removeItem("mindia_role");
  };

  // Función que se ejecuta cuando el usuario envía el formulario.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    try {
      const data = await loginRequest({
        email,
        password,
      });

      const userRole = getRoleFromResponse(data);

      localStorage.setItem("mindia_token", data.token);
      localStorage.setItem("mindia_user", JSON.stringify(data.user));
      localStorage.setItem("mindia_role", userRole);

      if (userRole === "admin" || userRole === "administrator") {
        navigate("/admin/dashboard");
        return;
      }

      if (userRole === "tutor") {
        navigate("/tutor/dashboard");
        return;
      }

      if (userRole === "support" || userRole === "support_staff") {
        navigate("/support/dashboard");
        return;
      }

      if (userRole === "student") {
        clearLocalSession();
        setErrorMessage(
          "El acceso de estudiantes corresponde a la aplicación móvil de MindIA."
        );
        return;
      }

      navigate("/unauthorized");
    } catch (error) {
      const backendMessage =
        error.response?.data?.message || "No se pudo iniciar sesión.";

      setErrorMessage(backendMessage);

      console.error("Error en login:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel" aria-label="Presentación de MindIA">
        <div className="login-brand-content">
          <img className="login-brand-logo" src={mindiaLogo} alt="MindIA" />

          <div className="login-brand-heading">
            <h1>Bienvenido a MindIA</h1>
            <p>
              Plataforma institucional para el seguimiento del bienestar
              emocional estudiantil.
            </p>
          </div>

          <div className="login-benefits-list">
            <article className="login-benefit-item">
              <div className="login-benefit-icon blue">
                <LockKeyhole size={28} />
              </div>

              <div>
                <h2>Seguridad y privacidad</h2>
                <p>Acceso protegido para personal autorizado.</p>
              </div>
            </article>

            <article className="login-benefit-item">
              <div className="login-benefit-icon mint">
                <BarChart3 size={28} />
              </div>

              <div>
                <h2>Seguimiento institucional</h2>
                <p>Herramientas para acompañar a estudiantes.</p>
              </div>
            </article>

            <article className="login-benefit-item">
              <div className="login-benefit-icon teal">
                <PieChart size={28} />
              </div>

              <div>
                <h2>Decisiones informadas</h2>
                <p>Datos organizados para una atención oportuna.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="login-form-panel" aria-label="Formulario de acceso">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-lock-icon">
            <LockKeyhole size={30} />
          </div>

          <div className="login-header">
            <h2>Iniciar sesión</h2>
            <p>Accede con tu cuenta institucional</p>
          </div>

          <div className="login-form-fields">
            <label className="login-field" htmlFor="email">
              <span>Correo institucional</span>

              <div className="login-input-wrapper">
                <Mail size={20} />
                <input
                  id="email"
                  type="email"
                  placeholder="correo@universidad.edu.mx"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="login-field" htmlFor="password">
              <span>Contraseña</span>

              <div className="login-input-wrapper">
                <LockKeyhole size={20} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>
          </div>

          <div className="login-options-row">
            <label className="login-remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Recordarme</span>
            </label>

            <button
              type="button"
              className="login-link-button"
              onClick={() =>
                setErrorMessage(
                  "Solicita al administrador del sistema el restablecimiento de tu contraseña."
                )
              }
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {errorMessage && <p className="login-error">{errorMessage}</p>}

          <button className="login-submit-button" type="submit" disabled={isLoading}>
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          <div className="login-info-box">
            <Info size={22} />
            <p>
              Acceso exclusivo para personal autorizado. Si no tienes una cuenta,
              contacta al administrador del sistema.
            </p>
          </div>
        </form>

        <footer className="login-footer">
          <span>© 2026 MindIA. Todos los derechos reservados.</span>
          <button type="button">Aviso de privacidad</button>
          <button type="button">Ayuda</button>
        </footer>
      </section>
    </main>
  );
}

export default LoginPage;
