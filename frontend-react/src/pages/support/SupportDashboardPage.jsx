// Importamos iconos para las métricas del área de apoyo.
import {
  Calendar,
  ClipboardList,
  HeartHandshake,
  Users,
} from "lucide-react";

// Importamos el layout base del sistema.
import DashboardLayout from "../../layouts/DashboardLayout";

function SupportDashboardPage() {
  return (
    <DashboardLayout>
      <section className="page-header">
        <h2>Dashboard de apoyo</h2>

        <p>
          Consulta canalizaciones recibidas, seguimiento activo y próximos casos.
        </p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <div className="metric-icon blue">
            <ClipboardList size={30} />
          </div>

          <div>
            <span>Casos recibidos</span>
            <h3>18</h3>
            <small>Este mes</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon orange">
            <Users size={30} />
          </div>

          <div>
            <span>En atención</span>
            <h3>7</h3>
            <small>Actualmente</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon green">
            <Calendar size={30} />
          </div>

          <div>
            <span>Citas de hoy</span>
            <h3>4</h3>
            <small>Programadas</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon purple">
            <HeartHandshake size={30} />
          </div>

          <div>
            <span>Seguimiento activo</span>
            <h3>12</h3>
            <small>Estudiantes</small>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <h3>Casos canalizados recientes</h3>

          <p>
            Estudiantes canalizados desde tutoría u otras áreas.
          </p>

          <div className="placeholder-box">
            Tabla pendiente de conectar con GET /api/support/referrals.
          </div>
        </article>

        <article className="panel-card">
          <h3>Agenda del día</h3>

          <p>
            Próximas sesiones programadas para el área de apoyo.
          </p>

          <div className="placeholder-box">
            Agenda visual pendiente de implementación.
          </div>
        </article>
      </section>
    </DashboardLayout>
  );
}

export default SupportDashboardPage;