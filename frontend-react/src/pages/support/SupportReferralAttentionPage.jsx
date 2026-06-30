import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardPlus,
  FileHeart,
  Mail,
  RefreshCw,
  Save,
  UserRound,
  UserRoundCheck,
} from "lucide-react";

import {
  createSupportReferralFollowupRequest,
  getSupportReferralFollowupsRequest,
} from "../../api/supportApi";

import "../../styles/pages/support/SupportReferralAttentionPage.css";

/*
  Pantalla "Registrar atención".

  Esta vista permite que el personal de apoyo registre una atención
  institucional sobre un caso canalizado.

  Importante:
  La atención registrada no representa diagnóstico clínico.
  Solo documenta seguimiento institucional dentro de MindIA.
*/
const SupportReferralAttentionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [referral, setReferral] = useState(null);
  const [followups, setFollowups] = useState([]);

  const [attentionType, setAttentionType] = useState("orientation");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");
  const [closeCase, setCloseCase] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
    Extrae arreglos desde distintas estructuras posibles del backend.
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
    Obtiene el nombre del estudiante relacionado con el caso.
  */
  const getReferralStudentName = (referralData) => {
    return (
      referralData?.student?.user?.name ||
      referralData?.student?.name ||
      referralData?.alert?.student?.user?.name ||
      referralData?.student_name ||
      "Estudiante no disponible"
    );
  };

  /*
    Obtiene el correo del estudiante relacionado.
  */
  const getReferralStudentEmail = (referralData) => {
    return (
      referralData?.student?.user?.email ||
      referralData?.student?.email ||
      referralData?.alert?.student?.user?.email ||
      referralData?.student_email ||
      "Sin correo"
    );
  };

  /*
    Obtiene la matrícula del estudiante.
  */
  const getReferralStudentEnrollment = (referralData) => {
    return (
      referralData?.student?.enrollment_key ||
      referralData?.alert?.student?.enrollment_key ||
      referralData?.student?.institutional_id ||
      "Sin matrícula"
    );
  };

  /*
    Obtiene el programa académico del estudiante.
  */
  const getReferralStudentCareer = (referralData) => {
    return (
      referralData?.student?.career ||
      referralData?.alert?.student?.career ||
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
      "Tutor no disponible"
    );
  };

  /*
    Obtiene el motivo de canalización.
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
    Obtiene la prioridad del caso.
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
    Obtiene clase visual de prioridad.
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
    Obtiene estado del caso canalizado.
  */
  const getReferralStatus = (referralData) => {
    return String(referralData?.status || "pending").toLowerCase();
  };

  /*
    Traduce estado del caso.
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
    Obtiene clase visual del estado.
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
    Traduce el tipo de atención guardado.
  */
  const getAttentionTypeLabel = (type) => {
    const labels = {
      orientation: "Orientación",
      interview: "Entrevista",
      follow_up: "Seguimiento",
      internal_referral: "Canalización interna",
      other: "Otro",
    };

    return labels[type] || type || "Sin tipo";
  };

  /*
    Obtiene fecha legible de un seguimiento.
  */
  const getFollowupDate = (followup) => {
    const rawDate =
      followup?.attended_at || followup?.created_at || followup?.date;

    if (!rawDate) {
      return "Sin fecha";
    }

    return new Date(rawDate).toLocaleDateString("es-MX");
  };

  /*
    Carga la información del caso y sus atenciones registradas.
  */
  const loadAttentionData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await getSupportReferralFollowupsRequest(id);


      const followupsList = extractList(response, ["followups"]);

      setReferral(response?.referral || null);
      setFollowups(followupsList);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudo cargar la información de atención del caso.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando atenciones del caso:",
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
    loadAttentionData();
  }, [id]);

  /*
    Últimas atenciones registradas.
  */
  const latestFollowups = useMemo(() => {
    return followups.slice(0, 5);
  }, [followups]);

  /*
    Guarda la atención institucional en el backend.
  */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!notes.trim()) {
      setErrorMessage("Escribe las notas de atención.");
      setSuccessMessage("");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      await createSupportReferralFollowupRequest(id, {
        attention_type: attentionType,
        notes,
        result,
        close_case: closeCase,
      });

      setSuccessMessage("Atención registrada correctamente.");

      setNotes("");
      setResult("");
      setCloseCase(false);

      await loadAttentionData();

      if (closeCase) {
        setTimeout(() => {
          navigate(`/support/referrals/${id}`);
        }, 900);
      }
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null;

      const backendMessage =
        firstValidationError ||
        error.response?.data?.message ||
        "No se pudo registrar la atención.";

      setErrorMessage(backendMessage);

      console.error(
        "Error registrando atención:",
        error.response?.data || error.message
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
    Estado de carga.
  */
  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Apoyo / Casos canalizados / Atención</p>
          <h2>Registrar atención</h2>
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
          <p className="breadcrumb">Apoyo / Casos canalizados / Atención</p>
          <h2>Registrar atención</h2>
          <p>
            Documenta el seguimiento institucional realizado por el área de
            apoyo.
          </p>
        </div>

        <div className="support-attention-header-actions">
          <button
            type="button"
            className="secondary-action-button"
            onClick={() => navigate(`/support/referrals/${id}`)}
          >
            <ArrowLeft size={18} />
            Volver
          </button>

          <button
            type="button"
            className="secondary-action-button"
            onClick={loadAttentionData}
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
          <div className="support-attention-main-card panel-card">
            <div className="support-attention-main-icon">
              <FileHeart size={36} />
            </div>

            <div className="support-attention-main-info">
              <h3>Canalización institucional</h3>
              <p>{getReferralReason(referral)}</p>

              <div className="support-attention-main-badges">
                <span className={getReferralPriorityBadgeClass(referral)}>
                  Prioridad {getReferralPriorityLabel(referral)}
                </span>

                <span className={getReferralStatusBadgeClass(referral)}>
                  {getReferralStatusLabel(referral)}
                </span>
              </div>
            </div>
          </div>

          <div className="support-attention-grid">
            <form className="panel-card support-attention-form" onSubmit={handleSubmit}>
              <h3>Datos de la atención</h3>
              <p>
                Registra el tipo de atención, notas y resultado institucional.
              </p>

              <div className="form-section">
                <label className="form-field">
                  <span>Tipo de atención *</span>

                  <select
                    value={attentionType}
                    onChange={(event) => setAttentionType(event.target.value)}
                    required
                  >
                    <option value="orientation">Orientación</option>
                    <option value="interview">Entrevista</option>
                    <option value="follow_up">Seguimiento</option>
                    <option value="internal_referral">
                      Canalización interna
                    </option>
                    <option value="other">Otro</option>
                  </select>
                </label>
              </div>

              <div className="form-section">
                <label className="form-field">
                  <span>Notas de atención *</span>

                  <textarea
                    className="support-attention-textarea"
                    placeholder="Describe qué atención se realizó con el estudiante..."
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Resultado o conclusión institucional</span>

                  <textarea
                    className="support-attention-textarea"
                    placeholder="Describe el resultado, acuerdo o recomendación institucional..."
                    value={result}
                    onChange={(event) => setResult(event.target.value)}
                  />
                </label>
              </div>

              <label className="support-attention-check">
                <input
                  type="checkbox"
                  checked={closeCase}
                  onChange={(event) => setCloseCase(event.target.checked)}
                />

                <span>Cerrar caso al guardar esta atención</span>
              </label>

              <div className="info-box">
                Este registro no representa un diagnóstico. Solo documenta
                seguimiento institucional realizado por el área de apoyo.
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={() => navigate(`/support/referrals/${id}`)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-action-button"
                  disabled={isSaving}
                >
                  <Save size={18} />
                  {isSaving ? "Guardando..." : "Guardar atención"}
                </button>
              </div>
            </form>

            <aside className="panel-card support-attention-summary-card">
              <h3>Resumen del caso</h3>
              <p>Información base de la canalización.</p>

              <div className="support-attention-student-card">
                <div className="support-attention-avatar">
                  <UserRound size={24} />
                </div>

                <div>
                  <strong>{getReferralStudentName(referral)}</strong>

                  <span>
                    <Mail size={15} />
                    {getReferralStudentEmail(referral)}
                  </span>

                  <div className="support-attention-tags">
                    <small>{getReferralStudentEnrollment(referral)}</small>
                    <small>{getReferralStudentCareer(referral)}</small>
                  </div>
                </div>
              </div>

              <div className="support-attention-tutor-card">
                <div className="support-attention-avatar tutor">
                  <UserRoundCheck size={24} />
                </div>

                <div>
                  <strong>{getReferralTutorName(referral)}</strong>
                  <span>Tutor que canalizó</span>
                </div>
              </div>

              <div className="support-attention-summary-row">
                <span>Atenciones registradas</span>
                <strong>{followups.length}</strong>
              </div>

              <div className="warning-box">
                Si se cierra el caso, su estado pasará a Cerrado.
              </div>
            </aside>
          </div>

          <div className="panel-card support-attention-history-card">
            <div className="table-header">
              <div>
                <h3>Historial de atención</h3>
                <p>Últimos registros realizados por el área de apoyo.</p>
              </div>
            </div>

            {latestFollowups.length === 0 ? (
              <div className="empty-summary">
                Todavía no hay atenciones registradas para este caso.
              </div>
            ) : (
              <div className="support-attention-history-list">
                {latestFollowups.map((followup) => (
                  <article
                    className="support-attention-history-item"
                    key={followup.id}
                  >
                    <div className="support-attention-history-icon">
                      <ClipboardPlus size={20} />
                    </div>

                    <div>
                      <div className="support-attention-history-header">
                        <strong>
                          {getAttentionTypeLabel(followup.attention_type)}
                        </strong>

                        <span>
                          <CalendarDays size={15} />
                          {getFollowupDate(followup)}
                        </span>
                      </div>

                      <p>{followup.notes}</p>

                      {followup.result && (
                        <small>Resultado: {followup.result}</small>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default SupportReferralAttentionPage;
