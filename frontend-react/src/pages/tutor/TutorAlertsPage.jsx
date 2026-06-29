import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";

import {
  getTutorAlertsRequest,
  reviewTutorAlertRequest,
} from "../../api/tutorApi";

import "../../styles/pages/tutor/TutorAlertsPage.css";
import { useNavigate } from "react-router-dom";


/*
  Pantalla de monitor de alertas del tutor.

  Objetivo:
  Permitir que el tutor consulte alertas generadas para sus estudiantes,
  identifique cuáles están pendientes y marque alertas como revisadas.

  Importante:
  Las alertas son indicadores institucionales de seguimiento.
  No representan diagnósticos clínicos.
*/
const TutorAlertsPage = () => {

    const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [reviewingAlertId, setReviewingAlertId] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
    Extrae una lista desde distintas estructuras posibles del backend.

    Soporta:
    - [...]
    - { alerts: [...] }
    - { data: [...] }
  */
  const extractList = (response, possibleKeys = []) => {
    if (Array.isArray(response)) {
      return response;
    }

    for (const key of possibleKeys) {
      if (Array.isArray(response?.[key])) {
        return response[key];
      }
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  };

  /*
    Obtiene el nombre del estudiante relacionado con la alerta.
  */
  const getAlertStudentName = (alert) => {
    return (
      alert?.student?.user?.name ||
      alert?.student?.name ||
      alert?.student_name ||
      "Estudiante no disponible"
    );
  };

  /*
    Obtiene el correo del estudiante relacionado con la alerta.
  */
  const getAlertStudentEmail = (alert) => {
    return (
      alert?.student?.user?.email ||
      alert?.student?.email ||
      alert?.student_email ||
      "Sin correo"
    );
  };

  /*
    Obtiene el nivel de riesgo de la alerta.

    Se soportan varias propiedades porque el backend puede mandar
    risk_level, priority, level o risk.
  */
  const getAlertRiskLevel = (alert) => {
    const risk =
      alert?.risk_level ||
      alert?.priority ||
      alert?.level ||
      alert?.risk ||
      "Sin nivel";

    return String(risk);
  };

  /*
    Obtiene el estado de la alerta.
  */
  const getAlertStatus = (alert) => {
    return String(alert?.status || "pending").toLowerCase();
  };

  /*
    Traduce el estado de la alerta a texto visible.
  */
  const getAlertStatusLabel = (alert) => {
    const status = getAlertStatus(alert);

    if (status === "pending" || status === "open") {
      return "Pendiente";
    }

    if (status === "reviewed") {
      return "Revisada";
    }

    if (status === "closed") {
      return "Cerrada";
    }

    return alert?.status || "Pendiente";
  };

  /*
    Define la clase visual del badge de estado.
  */
  const getAlertStatusBadgeClass = (alert) => {
    const status = getAlertStatus(alert);

    if (status === "pending" || status === "open") {
      return "badge orange";
    }

    if (status === "reviewed" || status === "closed") {
      return "badge green";
    }

    return "badge";
  };

  /*
    Define la clase visual del badge de riesgo.
  */
  const getAlertRiskBadgeClass = (alert) => {
    const risk = getAlertRiskLevel(alert).toLowerCase();

    if (
      risk.includes("high") ||
      risk.includes("alto") ||
      risk.includes("critical") ||
      risk.includes("crítico")
    ) {
      return "badge red";
    }

    if (
      risk.includes("medium") ||
      risk.includes("medio") ||
      risk.includes("moderate") ||
      risk.includes("moderado")
    ) {
      return "badge orange";
    }

    if (
      risk.includes("low") ||
      risk.includes("bajo") ||
      risk.includes("normal")
    ) {
      return "badge green";
    }

    return "badge";
  };

  /*
    Obtiene una descripción corta de la alerta.
  */
  const getAlertDescription = (alert) => {
    return (
      alert?.description ||
      alert?.message ||
      alert?.reason ||
      "Alerta institucional generada para seguimiento."
    );
  };

  /*
    Obtiene la fecha de creación de la alerta.
  */
  const getAlertDate = (alert) => {
    const rawDate = alert?.created_at || alert?.date || alert?.alert_date;

    if (!rawDate) {
      return "Sin fecha";
    }

    return new Date(rawDate).toLocaleDateString("es-MX");
  };

  /*
    Carga las alertas del tutor autenticado.
  */
  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await getTutorAlertsRequest();

      console.log("Respuesta alertas tutor:", response);

      const alertsList = extractList(response, ["alerts"]);

      setAlerts(alertsList);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudieron cargar las alertas del tutor.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando alertas:",
        error.response?.data || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
    Carga inicial.
  */
  useEffect(() => {
    loadAlerts();
  }, []);

  /*
    Alertas pendientes.
  */
  const pendingAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const status = getAlertStatus(alert);
      return status === "pending" || status === "open";
    });
  }, [alerts]);

  /*
    Alertas revisadas o cerradas.
  */
  const reviewedAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const status = getAlertStatus(alert);
      return status === "reviewed" || status === "closed";
    });
  }, [alerts]);

  /*
    Alertas de riesgo alto.
  */
  const highRiskAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const risk = getAlertRiskLevel(alert).toLowerCase();

      return (
        risk.includes("high") ||
        risk.includes("alto") ||
        risk.includes("critical") ||
        risk.includes("crítico")
      );
    });
  }, [alerts]);

  /*
    Alertas filtradas por búsqueda, estado y riesgo.
  */
  const filteredAlerts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return alerts.filter((alert) => {
      const status = getAlertStatus(alert);
      const risk = getAlertRiskLevel(alert).toLowerCase();

      const searchableText = [
        getAlertStudentName(alert),
        getAlertStudentEmail(alert),
        getAlertRiskLevel(alert),
        getAlertDescription(alert),
        getAlertStatusLabel(alert),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const matchesRisk =
        riskFilter === "all" || risk.includes(riskFilter);

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [alerts, searchTerm, statusFilter, riskFilter]);

  /*
    Marca una alerta como revisada.
  */
  const handleReviewAlert = async (alertId) => {
    try {
      setReviewingAlertId(alertId);
      setErrorMessage("");
      setSuccessMessage("");

      await reviewTutorAlertRequest(alertId);

      setSuccessMessage("Alerta marcada como revisada correctamente.");

      await loadAlerts();
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudo marcar la alerta como revisada.";

      setErrorMessage(backendMessage);

      console.error(
        "Error revisando alerta:",
        error.response?.data || error.message
      );
    } finally {
      setReviewingAlertId(null);
    }
  };

  /*
    Estado de carga.
  */
  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Tutor / Alertas</p>
          <h2>Monitor de alertas</h2>
          <p>Cargando alertas de seguimiento...</p>
        </div>

        <div className="panel-card">
          <div className="placeholder-box">Cargando información...</div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-header-with-actions page-header">
        <div>
          <p className="breadcrumb">Tutor / Alertas</p>
          <h2>Monitor de alertas</h2>
          <p>
            Consulta alertas generadas para estudiantes asignados y registra su
            revisión institucional.
          </p>
        </div>

        <button
          type="button"
          className="secondary-action-button"
          onClick={loadAlerts}
        >
          <RefreshCw size={18} />
          Actualizar
        </button>
      </div>

      {errorMessage && <div className="form-alert error">{errorMessage}</div>}

      {successMessage && (
        <div className="form-alert success">{successMessage}</div>
      )}

      <div className="metrics-grid">
        <article className="metric-card">
          <div className="metric-icon blue">
            <ShieldAlert size={28} />
          </div>

          <div>
            <span>Total alertas</span>
            <h3>{alerts.length}</h3>
            <small>Alertas registradas</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon orange">
            <Clock size={28} />
          </div>

          <div>
            <span>Pendientes</span>
            <h3>{pendingAlerts.length}</h3>
            <small>Requieren revisión</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon red">
            <AlertTriangle size={28} />
          </div>

          <div>
            <span>Riesgo alto</span>
            <h3>{highRiskAlerts.length}</h3>
            <small>Indicadores prioritarios</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon green">
            <CheckCircle2 size={28} />
          </div>

          <div>
            <span>Revisadas</span>
            <h3>{reviewedAlerts.length}</h3>
            <small>Con seguimiento</small>
          </div>
        </article>
      </div>

      <div className="panel-card tutor-alerts-filters">
        <h3>Filtros de alertas</h3>

        <div className="tutor-alerts-filters-grid">
          <div className="filter-input">
            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar por estudiante, correo o descripción..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Estado: Todos</option>
            <option value="pending">Pendientes</option>
            <option value="reviewed">Revisadas</option>
            <option value="closed">Cerradas</option>
          </select>

          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
          >
            <option value="all">Riesgo: Todos</option>
            <option value="high">Alto</option>
            <option value="medium">Medio</option>
            <option value="low">Bajo</option>
          </select>
        </div>
      </div>

      <div className="panel-card tutor-alerts-table-card">
        <div className="table-header">
          <div>
            <h3>Alertas registradas</h3>
            <p>
              Mostrando {filteredAlerts.length} de {alerts.length} alertas.
            </p>
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="empty-summary">
            No hay alertas registradas o no coinciden con los filtros.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Descripción</th>
                  <th>Riesgo</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <div className="user-cell">
                        <div className="table-avatar">
                          {getAlertStudentName(alert).charAt(0)}
                        </div>

                        <div>
                          <strong>{getAlertStudentName(alert)}</strong>
                          <span>{getAlertStudentEmail(alert)}</span>
                        </div>
                      </div>
                    </td>

                    <td>{getAlertDescription(alert)}</td>

                    <td>
                      <span className={getAlertRiskBadgeClass(alert)}>
                        {getAlertRiskLevel(alert)}
                      </span>
                    </td>

                    <td>
                      <span className={getAlertStatusBadgeClass(alert)}>
                        {getAlertStatusLabel(alert)}
                      </span>
                    </td>

                    <td>{getAlertDate(alert)}</td>

                    <td>
                        <div className="alert-actions-cell">
                            <button
                            type="button"
                            className="table-action-button"
                            onClick={() => navigate(`/tutor/alerts/${alert.id}`)}
                            >
                            Ver detalle
                            </button>

                            {getAlertStatus(alert) === "pending" ||
                            getAlertStatus(alert) === "open" ? (
                            <button
                                type="button"
                                className="table-action-button"
                                disabled={reviewingAlertId === alert.id}
                                onClick={() => handleReviewAlert(alert.id)}
                            >
                                {reviewingAlertId === alert.id ? "Revisando..." : "Revisar"}
                            </button>
                            ) : (
                            <span className="badge green">Atendida</span>
                            )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="info-box">
          Las alertas mostradas son indicadores institucionales de seguimiento.
          No representan diagnósticos ni evaluaciones clínicas.
        </div>
      </div>
    </section>
  );
};

export default TutorAlertsPage;