// Importamos iconos para las tarjetas métricas del tutor.
import {
  Bell,
  Calendar,
  ClipboardList,
  GraduationCap,
} from "lucide-react";

// Importamos el layout base del sistema.
import DashboardLayout from "../../layouts/DashboardLayout";

function TutorDashboardPage() {
  return (
    <DashboardLayout>
      <section className="page-header">
        <p className="breadcrumb">Dashboard / Tutor</p>

        <h2>Dashboard de tutor</h2>

        <p>
          Consulta estudiantes asignados, alertas recientes y seguimientos
          pendientes.
        </p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <div className="metric-icon blue">
            <GraduationCap size={30} />
          </div>

          <div>
            <span>Estudiantes asignados</span>
            <h3>42</h3>
            <small>Bajo seguimiento</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon orange">
            <Bell size={30} />
          </div>

          <div>
            <span>Alertas pendientes</span>
            <h3>6</h3>
            <small>Requieren revisión</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon purple">
            <ClipboardList size={30} />
          </div>

          <div>
            <span>En seguimiento</span>
            <h3>12</h3>
            <small>Casos activos</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon green">
            <Calendar size={30} />
          </div>

          <div>
            <span>Citas próximas</span>
            <h3>4</h3>
            <small>Esta semana</small>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <h3>Mis estudiantes asignados</h3>

          <p>
            Aquí se mostrará la tabla de estudiantes bajo responsabilidad
            académica del tutor.
          </p>

          <div className="placeholder-box">
            Tabla de estudiantes pendiente de conectar con
            GET /api/tutor/students.
          </div>
        </article>

        <article className="panel-card">
          <h3>Alertas recientes</h3>

          <p>
            Indicadores que requieren revisión o seguimiento institucional.
          </p>

          <div className="placeholder-box">
            Lista de alertas pendiente de conectar con GET /api/tutor/alerts.
          </div>
        </article>
      </section>
    </DashboardLayout>
  );
}

export default TutorDashboardPage;