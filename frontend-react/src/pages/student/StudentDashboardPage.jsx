// Importamos iconos para las métricas del estudiante.
import {
  ClipboardList,
  FileText,
  HeartHandshake,
  Shield,
} from "lucide-react";

// Importamos el layout base del sistema.
import DashboardLayout from "../../layouts/DashboardLayout";

function StudentDashboardPage() {
  return (
    <DashboardLayout>
      <section className="page-header">
        <h2>Dashboard estudiante</h2>

        <p>
          Consulta tu historial personal y registra tu estado emocional diario.
        </p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <div className="metric-icon blue">
            <ClipboardList size={30} />
          </div>

          <div>
            <span>Registro emocional</span>
            <h3>Hoy</h3>
            <small>Pendiente</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon green">
            <FileText size={30} />
          </div>

          <div>
            <span>Historial</span>
            <h3>7</h3>
            <small>Últimos registros</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon orange">
            <Shield size={30} />
          </div>

          <div>
            <span>Privacidad</span>
            <h3>Activa</h3>
            <small>Consentimiento aceptado</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon purple">
            <HeartHandshake size={30} />
          </div>

          <div>
            <span>Apoyo</span>
            <h3>Info</h3>
            <small>Disponible</small>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <h3>Historial emocional reciente</h3>

          <p>
            Aquí se mostrarán tus registros emocionales recientes.
          </p>

          <div className="placeholder-box">
            Historial pendiente de conectar con GET /api/emotional-records/me.
          </div>
        </article>

        <article className="panel-card">
          <h3>Apoyo institucional</h3>

          <p>
            Información general de apoyo disponible dentro de MindIA.
          </p>

          <div className="placeholder-box">
            Esta sección debe mostrar mensajes de apoyo y orientación general.
          </div>
        </article>
      </section>
    </DashboardLayout>
  );
}

export default StudentDashboardPage;