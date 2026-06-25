// Importamos useEffect para cargar datos cuando la pantalla se abre.
import { useEffect, useState } from "react";

// Importamos iconos para representar visualmente las métricas.
import {
  Bell,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  Users,
} from "lucide-react";

// Importamos el layout base con sidebar y topbar.
import DashboardLayout from "../../layouts/DashboardLayout";

// Importamos la función que consume GET /api/admin/dashboard-summary.
import { getAdminDashboardSummary } from "../../api/adminApi";

/*
  Diccionario de etiquetas visuales.

  Convierte valores técnicos del backend como "reviewed" o "medium"
  a textos más claros para mostrar al usuario.
*/
const LABELS = {
  reviewed: "Revisadas",
  open: "Abiertas",
  pending: "Pendientes",
  completed: "Completadas",
  in_review: "En revisión",
  medium: "Medio",
  low: "Bajo",
  high: "Alto",
};

/*
  getReadableLabel

  Recibe una clave del backend y devuelve una etiqueta legible.
  Si no encuentra coincidencia, reemplaza guiones bajos por espacios.
*/
const getReadableLabel = (key) => {
  return LABELS[key] || key.replaceAll("_", " ");
};

/*
  getColorByKey

  Define el color de barra según el tipo de dato.
  Esto ayuda a que el resumen se parezca más al diseño del MVP.
*/
const getColorByKey = (key) => {
  if (key === "high") {
    return "red";
  }

  if (key === "medium" || key === "pending") {
    return "orange";
  }

  if (key === "low" || key === "completed" || key === "reviewed") {
    return "green";
  }

  if (key === "in_review") {
    return "purple";
  }

  return "blue";
};

/*
  SummaryProgressList

  Componente reutilizable para mostrar datos agrupados como barras.
  Ejemplo:
  {
    reviewed: 1,
    pending: 2
  }

  Lo convierte en:
  Revisadas 1  █████
  Pendientes 2 ██████████
*/
function SummaryProgressList({ data }) {
  // Convertimos el objeto recibido a arreglo.
  const entries = Object.entries(data || {});

  // Calculamos el total para obtener porcentajes.
  const total = entries.reduce((accumulator, [, value]) => {
    return accumulator + Number(value);
  }, 0);

  // Si no hay datos, mostramos mensaje vacío.
  if (entries.length === 0 || total === 0) {
    return (
      <div className="empty-summary">
        No hay datos disponibles para mostrar.
      </div>
    );
  }

  return (
    <div className="summary-list">
      {entries.map(([key, value]) => {
        // Calculamos porcentaje para la barra visual.
        const percentage = Math.round((Number(value) / total) * 100);

        // Obtenemos color según la clave.
        const color = getColorByKey(key);

        return (
          <div className="summary-row" key={key}>
            <div className="summary-row-header">
              <span>{getReadableLabel(key)}</span>

              <strong>
                {value} · {percentage}%
              </strong>
            </div>

            <div className="summary-progress">
              <div
                className={`summary-progress-fill ${color}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminDashboardPage() {
  // Estado donde guardaremos la respuesta completa del dashboard.
  const [dashboardData, setDashboardData] = useState(null);

  // Estado para saber si los datos todavía están cargando.
  const [isLoading, setIsLoading] = useState(true);

  // Estado para mostrar errores si falla la petición al backend.
  const [errorMessage, setErrorMessage] = useState("");

  /*
    loadDashboardSummary

    Carga el resumen administrativo desde el backend Laravel.
  */
  const loadDashboardSummary = async () => {
    try {
      // Activamos carga y limpiamos errores anteriores.
      setIsLoading(true);
      setErrorMessage("");

      // Consumimos GET /api/admin/dashboard-summary.
      const data = await getAdminDashboardSummary();

      // Guardamos los datos reales para renderizarlos.
      setDashboardData(data);

      // Dejamos evidencia en consola para depuración.
      console.log("Dashboard admin:", data);
    } catch (error) {
      // Tomamos el mensaje del backend si existe.
      const backendMessage =
        error.response?.data?.message ||
        "No se pudo cargar el resumen administrativo.";

      // Guardamos el error para mostrarlo.
      setErrorMessage(backendMessage);

      // Mostramos detalle en consola para depuración.
      console.error(
        "Error cargando dashboard admin:",
        error.response?.data || error.message
      );
    } finally {
      // Finalizamos el estado de carga.
      setIsLoading(false);
    }
  };

  /*
    useEffect

    Ejecuta la carga inicial del dashboard cuando entra el usuario admin.
  */
  useEffect(() => {
    loadDashboardSummary();
  }, []);

  // Extraemos los conteos principales del backend.
  const summary = dashboardData?.summary || {};

  // Extraemos los datos agrupados de alertas.
  const alerts = dashboardData?.alerts || {};

  // Extraemos los datos agrupados de canalizaciones.
  const referrals = dashboardData?.referrals || {};

  return (
    <DashboardLayout>
      <section className="page-header">
        <h2>Dashboard general</h2>

        <p>
          Resumen institucional de actividad, alertas y seguimiento estudiantil.
        </p>
      </section>

      {isLoading && (
        <section className="panel-card">
          <p>Cargando resumen administrativo...</p>
        </section>
      )}

      {errorMessage && (
        <section className="panel-card">
          <p style={{ color: "#ef4444", fontWeight: "700" }}>
            {errorMessage}
          </p>
        </section>
      )}

      {!isLoading && !errorMessage && (
        <>
          <section className="metrics-grid">
            <article className="metric-card">
              <div className="metric-icon blue">
                <Users size={30} />
              </div>

              <div>
                <span>Usuarios totales</span>
                <h3>{summary.total_users || 0}</h3>
                <small>Todos los roles</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon green">
                <GraduationCap size={30} />
              </div>

              <div>
                <span>Estudiantes</span>
                <h3>{summary.total_students || 0}</h3>
                <small>Registrados</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon orange">
                <Bell size={30} />
              </div>

              <div>
                <span>Alertas</span>
                <h3>{summary.total_alerts || 0}</h3>
                <small>Generadas</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon purple">
                <HeartHandshake size={30} />
              </div>

              <div>
                <span>Canalizaciones</span>
                <h3>{summary.total_referrals || 0}</h3>
                <small>Registradas</small>
              </div>
            </article>
          </section>

          <section className="metrics-grid">
            <article className="metric-card">
              <div className="metric-icon blue">
                <GraduationCap size={30} />
              </div>

              <div>
                <span>Tutores</span>
                <h3>{summary.total_tutors || 0}</h3>
                <small>Activos en sistema</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon green">
                <HeartHandshake size={30} />
              </div>

              <div>
                <span>Soporte</span>
                <h3>{summary.total_support_staff || 0}</h3>
                <small>Personal registrado</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon orange">
                <ClipboardList size={30} />
              </div>

              <div>
                <span>Registros emocionales</span>
                <h3>{summary.total_emotional_records || 0}</h3>
                <small>Capturados</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon purple">
                <ClipboardList size={30} />
              </div>

              <div>
                <span>Consentimientos</span>
                <h3>{summary.accepted_privacy_consents || 0}</h3>
                <small>Aceptados</small>
              </div>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="panel-card">
              <h3>Resumen de alertas</h3>

              <p>
                Distribución general de alertas generadas dentro del sistema.
              </p>

              <h4>Por estado</h4>
              <SummaryProgressList data={alerts.by_status} />

              <h4 style={{ marginTop: "24px" }}>Por nivel de riesgo</h4>
              <SummaryProgressList data={alerts.by_risk_level} />

              <div className="info-box">
                Las alertas son indicadores de apoyo institucional. No
                representan diagnósticos psicológicos.
              </div>
            </article>

            <article className="panel-card">
              <h3>Resumen de canalizaciones</h3>

              <p>
                Estado general de casos enviados al área de apoyo institucional.
              </p>

              <h4>Por estado</h4>
              <SummaryProgressList data={referrals.by_status} />

              <h4 style={{ marginTop: "24px" }}>Por prioridad</h4>
              <SummaryProgressList data={referrals.by_priority} />

              <div className="info-box">
                Las canalizaciones deben ser revisadas únicamente por personal
                autorizado.
              </div>
            </article>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}

export default AdminDashboardPage;