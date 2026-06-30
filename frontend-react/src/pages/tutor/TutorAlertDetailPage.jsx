import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  RefreshCw,
  ShieldAlert,
  UserRound,
  Send,
} from "lucide-react";

import {
  getTutorAlertsRequest,
  reviewTutorAlertRequest,
} from "../../api/tutorApi";

import "../../styles/pages/tutor/TutorAlertDetailPage.css";

/*
  Pantalla de detalle de alerta del tutor.

  Objetivo:
  Mostrar la información individual de una alerta institucional:
  - estudiante relacionado,
  - nivel de riesgo,
  - estado,
  - descripción,
  - fecha de creación,
  - acción para marcar como revisada.

  Importante:
  Las alertas son indicadores institucionales de seguimiento.
  No representan diagnósticos clínicos.
*/
const TutorAlertDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [alert, setAlert] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
    Extrae una lista desde diferentes estructuras posibles del backend.
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
  const getAlertStudentName = (alertData) => {
    return (
      alertData?.student?.user?.name ||
      alertData?.student?.name ||
      alertData?.student_name ||
      "Estudiante no disponible"
    );
  };

  /*
    Obtiene el correo del estudiante relacionado con la alerta.
  */
  const getAlertStudentEmail = (alertData) => {
    return (
      alertData?.student?.user?.email ||
      alertData?.student?.email ||
      alertData?.student_email ||
      "Sin correo"
    );
  };

  /*
    Obtiene la matrícula o clave institucional del estudiante.
  */
  const getAlertStudentEnrollment = (alertData) => {
    return (
      alertData?.student?.enrollment_key ||
      alertData?.student?.institutional_id ||
      alertData?.student_code ||
      "Sin matrícula"
    );
  };

  /*
    Obtiene el programa académico del estudiante.
  */
  const getAlertStudentCareer = (alertData) => {
    return (
      alertData?.student?.career ||
      alertData?.student?.program ||
      "Sin programa académico"
    );
  };

  /*
    Obtiene el nivel de riesgo de la alerta.
  */
  const getAlertRiskLevel = (alertData) => {
    const risk =
      alertData?.risk_level ||
      alertData?.priority ||
      alertData?.level ||
      alertData?.risk ||
      "Sin nivel";

    return String(risk);
  };

  /*
    Traduce el nivel de riesgo a español para mostrarlo en pantalla.

    El backend puede enviar valores como:
    - high, medium, low
    - critical, moderate, normal
    - alto, medio, bajo

    Internamente se conserva el valor original para filtros y guardado.
  */
  const getAlertRiskLevelLabel = (alert) => {
    const rawRisk = getAlertRiskLevel(alert);
    const risk = rawRisk.trim().toLowerCase();

    if (
      risk.includes("critical") ||
      risk.includes("crítico") ||
      risk.includes("critico")
    ) {
      return "Crítico";
    }

    if (risk.includes("high") || risk.includes("alto")) {
      return "Alto";
    }

    if (
      risk.includes("medium") ||
      risk.includes("medio") ||
      risk.includes("moderate") ||
      risk.includes("moderado")
    ) {
      return "Medio";
    }

    if (risk.includes("low") || risk.includes("bajo")) {
      return "Bajo";
    }

    if (risk.includes("normal")) {
      return "Normal";
    }

    return rawRisk;
  };


  /*
    Obtiene el estado real de la alerta.
  */
  const getAlertStatus = (alertData) => {
    return String(alertData?.status || "pending").toLowerCase();
  };

  /*
    Traduce el estado para mostrarlo al usuario.
  */
  const getAlertStatusLabel = (alertData) => {
    const status = getAlertStatus(alertData);

    if (status === "pending" || status === "open") {
      return "Pendiente";
    }

    if (status === "reviewed") {
      return "Revisada";
    }

    if (status === "closed") {
      return "Cerrada";
    }

    return alertData?.status || "Pendiente";
  };

  /*
    Clase visual para el estado de la alerta.
  */
  const getAlertStatusBadgeClass = (alertData) => {
    const status = getAlertStatus(alertData);

    if (status === "pending" || status === "open") {
      return "badge orange";
    }

    if (status === "reviewed" || status === "closed") {
      return "badge green";
    }

    return "badge";
  };

  /*
    Clase visual para el nivel de riesgo.
  */
  const getAlertRiskBadgeClass = (alertData) => {
    const risk = getAlertRiskLevel(alertData).toLowerCase();

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
    Obtiene la descripción de la alerta.
  */
  const getAlertDescription = (alertData) => {
    return (
      alertData?.description ||
      alertData?.message ||
      alertData?.reason ||
      "Alerta institucional generada para seguimiento."
    );
  };

  /*
    Obtiene la fecha de creación.
  */
  const getAlertDate = (alertData) => {
    const rawDate =
      alertData?.created_at ||
      alertData?.date ||
      alertData?.alert_date;

    if (!rawDate) {
      return "Sin fecha";
    }

    return new Date(rawDate).toLocaleDateString("es-MX");
  };

  /*
    Carga la alerta desde la lista de alertas del tutor.

    Como todavía no usamos endpoint individual, se consulta GET /api/tutor/alerts
    y se filtra por el ID recibido en la URL.
  */
  const loadAlertDetail = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await getTutorAlertsRequest();
      const alertsList = extractList(response, ["alerts"]);

      const selectedAlert = alertsList.find((alertItem) => {
        return String(alertItem?.id) === String(id);
      });

      if (!selectedAlert) {
        setAlert(null);
        setErrorMessage("No se encontró la alerta solicitada.");
        return;
      }

      setAlert(selectedAlert);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudo cargar el detalle de la alerta.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando detalle de alerta:",
        error.response?.data || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
    Carga inicial del detalle.
  */
  useEffect(() => {
    loadAlertDetail();
  }, [id]);

  /*
    Marca la alerta como revisada.
  */
  const handleReviewAlert = async () => {
    try {
      setIsReviewing(true);
      setErrorMessage("");
      setSuccessMessage("");

      await reviewTutorAlertRequest(id);

      setSuccessMessage("Alerta marcada como revisada correctamente.");

      await loadAlertDetail();
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
      setIsReviewing(false);
    }
  };

  /*
    Estado de carga.
  */
  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Tutor / Alertas / Detalle</p>
          <h2>Detalle de alerta</h2>
          <p>Cargando información de la alerta...</p>
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
          <p className="breadcrumb">Tutor / Alertas / Detalle</p>
          <h2>Detalle de alerta</h2>
          <p>
            Consulta la información individual de la alerta y registra su
            revisión institucional.
          </p>
        </div>

        <div className="alert-detail-header-actions">
          <button
            type="button"
            className="secondary-action-button"
            onClick={() => navigate("/tutor/alerts")}
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          <button
            type="button"
            className="secondary-action-button"
            onClick={loadAlertDetail}
          >
            <RefreshCw size={18} />
            Actualizar
          </button>
        </div>
      </div>

      {errorMessage && <div className="form-alert error">{errorMessage}</div>}

      {successMessage && (
        <div className="form-alert success">{successMessage}</div>
      )}

      {alert && (
        <>
          <div className="alert-detail-main-card panel-card">
            <div className="alert-detail-icon">
              <ShieldAlert size={36} />
            </div>

            <div className="alert-detail-title">
              <h3>Alerta institucional de seguimiento</h3>
              <p>{getAlertDescription(alert)}</p>

              <div className="alert-detail-badges">
                <span className={getAlertRiskBadgeClass(alert)}>
                  {getAlertRiskLevelLabel(alert)}
                </span>

                <span className={getAlertStatusBadgeClass(alert)}>
                  {getAlertStatusLabel(alert)}
                </span>
              </div>
            </div>

            <div className="alert-detail-main-actions">
                <button
                    type="button"
                    className="primary-action-button"
                    onClick={() => navigate(`/tutor/alerts/${alert.id}/referral`)}
                >
                    <Send size={18} />
                    Canalizar a apoyo
                </button>

                {getAlertStatus(alert) === "pending" ||
                getAlertStatus(alert) === "open" ? (
                    <button
                    type="button"
                    className="secondary-action-button"
                    disabled={isReviewing}
                    onClick={handleReviewAlert}
                    >
                    <CheckCircle2 size={18} />
                    {isReviewing ? "Revisando..." : "Marcar revisada"}
                    </button>
                ) : (
                    <span className="badge green">Alerta atendida</span>
                )}
            </div>
          </div>

          <div className="metrics-grid">
            <article className="metric-card">
              <div className="metric-icon orange">
                <AlertTriangle size={28} />
              </div>

              <div>
                <span>Nivel de riesgo</span>
                <h3 className="alert-detail-risk-title">
                  {getAlertRiskLevelLabel(alert)}
                </h3>
                <small>Indicador institucional</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon green">
                <CheckCircle2 size={28} />
              </div>

              <div>
                <span>Estado</span>
                <h3>{getAlertStatusLabel(alert)}</h3>
                <small>Seguimiento de alerta</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon blue">
                <CalendarDays size={28} />
              </div>

              <div>
                <span>Fecha</span>
                <h3 className="alert-detail-date-title">
                  {getAlertDate(alert)}
                </h3>
                <small>Registro de alerta</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon purple">
                <UserRound size={28} />
              </div>

              <div>
                <span>Estudiante</span>
                <h3 className="alert-detail-student-title">
                  {getAlertStudentName(alert).charAt(0)}
                </h3>
                <small>Asignado al tutor</small>
              </div>
            </article>
          </div>

          <div className="alert-detail-grid">
            <div className="panel-card">
              <h3>Estudiante relacionado</h3>
              <p>Información académica vinculada a la alerta.</p>

              <div className="alert-student-card">
                <div className="alert-student-avatar">
                  {getAlertStudentName(alert).charAt(0)}
                </div>

                <div>
                  <strong>{getAlertStudentName(alert)}</strong>

                  <span>
                    <Mail size={16} />
                    {getAlertStudentEmail(alert)}
                  </span>

                  <div className="alert-student-tags">
                    <small>{getAlertStudentEnrollment(alert)}</small>
                    <small>{getAlertStudentCareer(alert)}</small>
                  </div>
                </div>
              </div>
            </div>

            <aside className="panel-card">
              <h3>Interpretación institucional</h3>
              <p>Uso correcto de la alerta dentro de MindIA.</p>

              <div className="alert-interpretation-box">
                <Clock size={24} />

                <div>
                  <strong>Seguimiento sugerido</strong>
                  <span>
                    La alerta sirve para priorizar atención, revisar el caso y
                    decidir si se requiere seguimiento adicional.
                  </span>
                </div>
              </div>

              <div className="info-box">
                Esta alerta no representa un diagnóstico. Solo es un indicador
                institucional de apoyo para seguimiento académico y canalización.
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
};

export default TutorAlertDetailPage;
