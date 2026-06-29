import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Mail,
  RefreshCw,
  Send,
  UserRound,
} from "lucide-react";

import {
  createTutorReferralRequest,
  getTutorAlertsRequest,
  getTutorSupportStaffRequest,
} from "../../api/tutorApi";

import "../../styles/pages/tutor/TutorReferralPage.css";


/*
  Pantalla para canalizar una alerta al área de apoyo institucional.

  Esta vista permite que el tutor envíe una alerta/caso a personal de apoyo.
  La canalización no representa un diagnóstico; únicamente registra que el caso
  requiere seguimiento por otra área institucional.
*/
const TutorReferralPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [alert, setAlert] = useState(null);
    const [supportStaffOptions, setSupportStaffOptions] = useState([]);

    const [selectedSupportStaffId, setSelectedSupportStaffId] = useState("");
    const [priority, setPriority] = useState("medium");
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");


  /*
    Extrae arreglos desde diferentes estructuras posibles del backend.
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
    Obtiene el nombre del estudiante relacionado.
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
    Obtiene el correo del estudiante relacionado.
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
    Obtiene la matrícula del estudiante.
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
    Obtiene la fecha de la alerta.
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
    Clase visual del badge de riesgo.
  */
  const getRiskBadgeClass = (alertData) => {
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
    Carga la alerta usando el listado de alertas del tutor.

    Como por ahora no usamos endpoint individual, se obtiene la lista completa
    y se busca la alerta correspondiente al ID de la URL.
  */
  const loadAlert = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const [alertsResponse, supportStaffResponse] = await Promise.all([
        getTutorAlertsRequest(),
        getTutorSupportStaffRequest(),
        ]);

        console.log("Canalización - alertas:", alertsResponse);
        console.log("Canalización - personal de apoyo:", supportStaffResponse);

        const alertsList = extractList(alertsResponse, ["alerts"]);

        const supportList = extractList(supportStaffResponse, [
        "support_staff",
        "supportStaff",
        "users",
        ]);

        setSupportStaffOptions(supportList);

        if (supportList.length > 0) {
        setSelectedSupportStaffId((currentValue) => {
            return currentValue || String(supportList[0].id);
        });
        }

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
        "No se pudo cargar la alerta para canalización.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando alerta para canalización:",
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
    loadAlert();
  }, [id]);

  /*
    Envía la canalización al backend.
  */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!reason.trim()) {
      setErrorMessage("Escribe el motivo de canalización.");
      setSuccessMessage("");
      return;
    }

    if (!selectedSupportStaffId) {
        setErrorMessage("Selecciona el personal de apoyo al que se canalizará el caso.");
        setSuccessMessage("");
        return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      /*
        Se mandan nombres de campos compatibles con posibles validaciones
        del backend. Laravel normalmente ignora campos extra si no los usa.
      */

      await createTutorReferralRequest(id, {
        /*
            Campo requerido por Laravel.
            Este ID viene del select dinámico de personal de apoyo.
        */
        referred_to: Number(selectedSupportStaffId),

        priority,
        reason,
        referral_reason: reason,
        description: reason,
        notes,
        comment: notes,
      });

      setSuccessMessage("Caso canalizado a apoyo correctamente.");

      setTimeout(() => {
        navigate("/tutor/alerts");
      }, 900);
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null;

      const backendMessage =
        firstValidationError ||
        error.response?.data?.message ||
        "No se pudo canalizar el caso a apoyo.";

      setErrorMessage(backendMessage);

      console.error(
        "Error canalizando a apoyo:",
        error.response?.data || error.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
    Estado de carga.
  */
  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Tutor / Alertas / Canalizar</p>
          <h2>Canalizar a apoyo</h2>
          <p>Cargando alerta seleccionada...</p>
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
          <p className="breadcrumb">Tutor / Alertas / Canalizar</p>
          <h2>Canalizar a apoyo</h2>
          <p>
            Registra una canalización institucional para que el área de apoyo
            pueda dar seguimiento al caso.
          </p>
        </div>

        <div className="referral-header-actions">
          <button
            type="button"
            className="secondary-action-button"
            onClick={() => navigate(`/tutor/alerts/${id}`)}
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          <button
            type="button"
            className="secondary-action-button"
            onClick={loadAlert}
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
        <div className="referral-grid">
          <form className="panel-card referral-form" onSubmit={handleSubmit}>
            <h3>Datos de canalización</h3>
            <p>
              Completa la información necesaria para enviar el caso al personal
              de apoyo institucional.
            </p>

            <label className="form-field">
                <span>Canalizar con *</span>

                <select
                    value={selectedSupportStaffId}
                    onChange={(event) => setSelectedSupportStaffId(event.target.value)}
                    required
                >
                    <option value="">Selecciona personal de apoyo</option>

                    {supportStaffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                        {staff.name} - {staff.email}
                    </option>
                    ))}
                </select>
            </label>

            <div className="form-section">
              <div className="form-grid-2">
                <label className="form-field">
                  <span>Prioridad *</span>

                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    required
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Riesgo detectado</span>

                  <input
                    type="text"
                    value={getAlertRiskLevel(alert)}
                    disabled
                  />
                </label>
              </div>
            </div>

            <div className="form-section">
              <label className="form-field">
                <span>Motivo de canalización *</span>

                <textarea
                  className="referral-textarea"
                  placeholder="Describe por qué se canaliza este caso al área de apoyo..."
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  required
                />
              </label>

              <label className="form-field">
                <span>Observaciones adicionales</span>

                <textarea
                  className="referral-textarea"
                  placeholder="Agrega contexto adicional para el personal de apoyo..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>
            </div>

            <div className="info-box">
              La canalización es un registro institucional de seguimiento. No
              representa un diagnóstico ni una evaluación clínica.
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-action-button"
                onClick={() => navigate(`/tutor/alerts/${id}`)}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-action-button"
                disabled={isSubmitting}
              >
                <Send size={18} />
                {isSubmitting ? "Canalizando..." : "Canalizar caso"}
              </button>
            </div>
          </form>

          <aside className="panel-card referral-summary-card">
            <h3>Resumen del caso</h3>
            <p>Información de la alerta que será enviada a apoyo.</p>

            <div className="referral-alert-box">
              <AlertTriangle size={24} />

              <div>
                <strong>Alerta institucional</strong>
                <span>{getAlertDescription(alert)}</span>
              </div>
            </div>

            <div className="referral-summary-section">
              <span>Riesgo</span>
              <strong className={getRiskBadgeClass(alert)}>
                {getAlertRiskLevel(alert)}
              </strong>
            </div>

            <div className="referral-summary-section">
              <span>Fecha</span>
              <strong>{getAlertDate(alert)}</strong>
            </div>

            <div className="referral-student-card">
              <div className="referral-student-avatar">
                <UserRound size={24} />
              </div>

              <div>
                <strong>{getAlertStudentName(alert)}</strong>

                <span>
                  <Mail size={15} />
                  {getAlertStudentEmail(alert)}
                </span>

                <div className="referral-student-tags">
                  <small>{getAlertStudentEnrollment(alert)}</small>
                  <small>{getAlertStudentCareer(alert)}</small>
                </div>
              </div>
            </div>

            <div className="warning-box">
              El personal de apoyo deberá revisar el caso y registrar el
              seguimiento correspondiente.
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

export default TutorReferralPage;