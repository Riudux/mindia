import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileHeart,
  Mail,
  RefreshCw,
  UserRound,
  UserRoundCheck,
} from "lucide-react";

import {
  getSupportReferralsRequest,
  updateSupportReferralStatusRequest,
} from "../../api/supportApi";

import "../../styles/pages/support/SupportReferralDetailPage.css";

/*
  Pantalla de detalle de caso canalizado.

  Esta vista permite al personal de apoyo consultar la información completa
  de una canalización recibida:
  - estudiante relacionado,
  - tutor que canalizó,
  - motivo,
  - prioridad,
  - estado,
  - fecha,
  - alerta relacionada,
  - acciones para iniciar atención o cerrar caso.

  Importante:
  El caso canalizado es un registro institucional de seguimiento.
  No representa un diagnóstico clínico.
*/
const SupportReferralDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [referral, setReferral] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
    Extrae listas desde distintas estructuras posibles del backend.

    Soporta:
    - [...]
    - { referrals: [...] }
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
    Obtiene el nombre del estudiante relacionado con la canalización.
  */
  const getReferralStudentName = (referralData) => {
    return (
      referralData?.alert?.student?.user?.name ||
      referralData?.alert?.student?.name ||
      referralData?.student?.user?.name ||
      referralData?.student?.name ||
      referralData?.student_name ||
      "Estudiante no disponible"
    );
  };

  /*
    Obtiene el correo del estudiante relacionado.
  */
  const getReferralStudentEmail = (referralData) => {
    return (
      referralData?.alert?.student?.user?.email ||
      referralData?.alert?.student?.email ||
      referralData?.student?.user?.email ||
      referralData?.student?.email ||
      referralData?.student_email ||
      "Sin correo"
    );
  };

  /*
    Obtiene la matrícula del estudiante.
  */
  const getReferralStudentEnrollment = (referralData) => {
    return (
      referralData?.alert?.student?.enrollment_key ||
      referralData?.student?.enrollment_key ||
      referralData?.student?.institutional_id ||
      "Sin matrícula"
    );
  };

  /*
    Obtiene el programa académico del estudiante.
  */
  const getReferralStudentCareer = (referralData) => {
    return (
      referralData?.alert?.student?.career ||
      referralData?.student?.career ||
      referralData?.student?.program ||
      "Sin programa académico"
    );
  };

  /*
    Obtiene el tutor que canalizó el caso.
  */
  const getReferralTutorName = (referralData) => {
    return (
      referralData?.tutor?.user?.name ||
      referralData?.tutor?.name ||
      referralData?.referred_by?.user?.name ||
      referralData?.referred_by_name ||
      "Tutor no disponible"
    );
  };

  /*
    Obtiene el correo del tutor.
  */
  const getReferralTutorEmail = (referralData) => {
    return (
      referralData?.tutor?.user?.email ||
      referralData?.tutor?.email ||
      referralData?.referred_by?.user?.email ||
      "Sin correo"
    );
  };

  /*
    Obtiene el motivo principal de canalización.
  */
  const getReferralReason = (referralData) => {
    return (
      referralData?.reason ||
      referralData?.referral_reason ||
      referralData?.description ||
      referralData?.alert?.description ||
      referralData?.alert?.message ||
      "Caso canalizado para seguimiento institucional."
    );
  };

  /*
    Obtiene observaciones adicionales del tutor.
  */
  const getReferralNotes = (referralData) => {
    return (
      referralData?.notes ||
      referralData?.comment ||
      referralData?.observations ||
      "Sin observaciones adicionales."
    );
  };

  /*
    Obtiene la descripción de la alerta relacionada.
  */
  const getAlertDescription = (referralData) => {
    return (
      referralData?.alert?.description ||
      referralData?.alert?.message ||
      "Alerta institucional relacionada con la canalización."
    );
  };

  /*
    Obtiene el nivel de riesgo de la alerta relacionada, si existe.
  */
  const getAlertRiskLevel = (referralData) => {
    const risk =
      referralData?.alert?.risk_level ||
      referralData?.alert?.priority ||
      referralData?.alert?.level ||
      referralData?.alert?.risk ||
      referralData?.priority ||
      "Sin nivel";

    return String(risk);
  };

  /*
    Obtiene la prioridad real del caso.

    Estados esperados:
    - low
    - medium
    - high
  */
  const getReferralPriority = (referralData) => {
    return String(referralData?.priority || "medium").toLowerCase();
  };

  /*
    Traduce prioridad a español.
  */
  const getReferralPriorityLabel = (referralData) => {
    const priority = getReferralPriority(referralData);

    if (priority === "low") {
      return "Baja";
    }

    if (priority === "medium") {
      return "Media";
    }

    if (priority === "high") {
      return "Alta";
    }

    return referralData?.priority || "Media";
  };

  /*
    Clase visual para la prioridad.
  */
  const getReferralPriorityBadgeClass = (referralData) => {
    const priority = getReferralPriority(referralData);

    if (priority === "high") {
      return "badge red";
    }

    if (priority === "medium") {
      return "badge orange";
    }

    if (priority === "low") {
      return "badge green";
    }

    return "badge";
  };

  /*
    Obtiene el estado real del caso.

    Tu backend acepta:
    - pending
    - in_review
    - completed
    - cancelled
  */
  const getReferralStatus = (referralData) => {
    return String(referralData?.status || "pending").toLowerCase();
  };

  /*
    Traduce estado a español.
  */
  const getReferralStatusLabel = (referralData) => {
    const status = getReferralStatus(referralData);

    if (status === "pending") {
      return "Pendiente";
    }

    if (status === "in_review" || status === "in_progress") {
      return "En atención";
    }

    if (status === "completed" || status === "closed") {
      return "Cerrado";
    }

    if (status === "cancelled") {
      return "Cancelado";
    }

    return referralData?.status || "Pendiente";
  };

  /*
    Clase visual para el estado.
  */
  const getReferralStatusBadgeClass = (referralData) => {
    const status = getReferralStatus(referralData);

    if (status === "pending") {
      return "badge orange";
    }

    if (status === "in_review" || status === "in_progress") {
      return "badge light-blue";
    }

    if (status === "completed" || status === "closed") {
      return "badge green";
    }

    if (status === "cancelled") {
      return "badge red";
    }

    return "badge";
  };

  /*
    Obtiene fecha de canalización.
  */
  const getReferralDate = (referralData) => {
    const rawDate =
      referralData?.created_at ||
      referralData?.referral_date ||
      referralData?.referred_at ||
      referralData?.date;

    if (!rawDate) {
      return "Sin fecha";
    }

    return new Date(rawDate).toLocaleDateString("es-MX");
  };

  /*
    Carga el caso canalizado usando el listado de canalizaciones.

    Como todavía no usamos endpoint individual, se obtiene GET /api/support/referrals
    y se busca el caso con el ID recibido en la URL.
  */
  const loadReferralDetail = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await getSupportReferralsRequest();

      console.log("Detalle caso canalizado:", response);

      const referralsList = extractList(response, ["referrals"]);

      const selectedReferral = referralsList.find((referralItem) => {
        return String(referralItem?.id) === String(id);
      });

      if (!selectedReferral) {
        setReferral(null);
        setErrorMessage("No se encontró el caso canalizado solicitado.");
        return;
      }

      setReferral(selectedReferral);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudo cargar el detalle del caso canalizado.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando detalle de canalización:",
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
    loadReferralDetail();
  }, [id]);

  /*
    Actualiza el estado del caso.

    Flujo:
    - pending → in_review
    - in_review → completed
  */
  const handleStatusChange = async (newStatus) => {
    try {
      setIsUpdatingStatus(true);
      setErrorMessage("");
      setSuccessMessage("");

      await updateSupportReferralStatusRequest(id, {
        status: newStatus,
      });

      setSuccessMessage("Estado del caso actualizado correctamente.");

      await loadReferralDetail();
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null;

      const backendMessage =
        firstValidationError ||
        error.response?.data?.message ||
        "No se pudo actualizar el estado del caso.";

      setErrorMessage(backendMessage);

      console.error(
        "Error actualizando estado del caso:",
        error.response?.data || error.message
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  /*
    Estado de carga.
  */
  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Apoyo / Casos canalizados / Detalle</p>
          <h2>Detalle de caso canalizado</h2>
          <p>Cargando información del caso...</p>
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
          <p className="breadcrumb">Apoyo / Casos canalizados / Detalle</p>
          <h2>Detalle de caso canalizado</h2>
          <p>
            Consulta la información del caso recibido y registra su avance de
            atención institucional.
          </p>
        </div>

        <div className="support-referral-detail-actions">
          <button
            type="button"
            className="secondary-action-button"
            onClick={() => navigate("/support/referrals")}
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          <button
            type="button"
            className="secondary-action-button"
            onClick={loadReferralDetail}
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

      {referral && (
        <>
          <div className="support-referral-main-card panel-card">
            <div className="support-referral-main-icon">
              <FileHeart size={36} />
            </div>

            <div className="support-referral-main-info">
              <h3>Canalización institucional</h3>
              <p>{getReferralReason(referral)}</p>

              <div className="support-referral-main-badges">
                <span className={getReferralPriorityBadgeClass(referral)}>
                  Prioridad {getReferralPriorityLabel(referral)}
                </span>

                <span className={getReferralStatusBadgeClass(referral)}>
                  {getReferralStatusLabel(referral)}
                </span>
              </div>
            </div>

            <div className="support-referral-main-actions">
              {getReferralStatus(referral) === "pending" && (
                <button
                  type="button"
                  className="primary-action-button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange("in_review")}
                >
                  <UserRoundCheck size={18} />
                  {isUpdatingStatus ? "Actualizando..." : "Iniciar atención"}
                </button>
              )}

              {(getReferralStatus(referral) === "in_review" ||
                getReferralStatus(referral) === "in_progress") && (
                <button
                  type="button"
                  className="primary-action-button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange("completed")}
                >
                  <CheckCircle2 size={18} />
                  {isUpdatingStatus ? "Actualizando..." : "Cerrar caso"}
                </button>
              )}

              {(getReferralStatus(referral) === "completed" ||
                getReferralStatus(referral) === "closed") && (
                <span className="badge green">Caso finalizado</span>
              )}

              {getReferralStatus(referral) === "cancelled" && (
                <span className="badge red">Caso cancelado</span>
              )}
            </div>
          </div>

          <div className="metrics-grid">
            <article className="metric-card">
              <div className="metric-icon orange">
                <AlertTriangle size={28} />
              </div>

              <div>
                <span>Prioridad</span>
                <h3>{getReferralPriorityLabel(referral)}</h3>
                <small>Nivel de atención</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon purple">
                <Clock size={28} />
              </div>

              <div>
                <span>Estado</span>
                <h3>{getReferralStatusLabel(referral)}</h3>
                <small>Seguimiento del caso</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon blue">
                <CalendarDays size={28} />
              </div>

              <div>
                <span>Fecha</span>
                <h3 className="support-referral-date-title">
                  {getReferralDate(referral)}
                </h3>
                <small>Canalización</small>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon green">
                <CheckCircle2 size={28} />
              </div>

              <div>
                <span>Área</span>
                <h3>Apoyo</h3>
                <small>Atención institucional</small>
              </div>
            </article>
          </div>

          <div className="support-referral-detail-grid">
            <div className="panel-card">
              <h3>Información del caso</h3>
              <p>Motivo y observaciones registradas en la canalización.</p>

              <div className="support-referral-info-box">
                <strong>Motivo de canalización</strong>
                <p>{getReferralReason(referral)}</p>
              </div>

              <div className="support-referral-info-box">
                <strong>Observaciones adicionales</strong>
                <p>{getReferralNotes(referral)}</p>
              </div>

              <div className="support-referral-info-box">
                <strong>Alerta relacionada</strong>
                <p>{getAlertDescription(referral)}</p>
                <span className="badge light-blue">
                  Riesgo relacionado: {getAlertRiskLevel(referral)}
                </span>
              </div>
            </div>

            <aside className="panel-card">
              <h3>Personas relacionadas</h3>
              <p>Estudiante y tutor vinculados al caso.</p>

              <div className="support-person-card">
                <div className="support-person-avatar">
                  <UserRound size={24} />
                </div>

                <div>
                  <strong>{getReferralStudentName(referral)}</strong>
                  <span>
                    <Mail size={15} />
                    {getReferralStudentEmail(referral)}
                  </span>

                  <div className="support-person-tags">
                    <small>{getReferralStudentEnrollment(referral)}</small>
                    <small>{getReferralStudentCareer(referral)}</small>
                  </div>
                </div>
              </div>

              <div className="support-person-card">
                <div className="support-person-avatar tutor">
                  <UserRoundCheck size={24} />
                </div>

                <div>
                  <strong>{getReferralTutorName(referral)}</strong>
                  <span>
                    <Mail size={15} />
                    {getReferralTutorEmail(referral)}
                  </span>

                  <div className="support-person-tags">
                    <small>Tutor que canalizó</small>
                  </div>
                </div>
              </div>

              <div className="info-box">
                Este caso no representa un diagnóstico. Es un registro
                institucional para priorizar atención y seguimiento.
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
};

export default SupportReferralDetailPage;