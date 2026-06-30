import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileHeart,
  RefreshCw,
  Search,
  UserRoundCheck,
} from "lucide-react";

import { getSupportReferralsRequest } from "../../api/supportApi";

import "../../styles/pages/support/SupportDashboardPage.css";

/*
  Dashboard principal del personal de apoyo.

  Objetivo:
  Mostrar los casos canalizados desde tutoría hacia el área de apoyo
  institucional.

  Importante:
  Los casos mostrados son canalizaciones institucionales de seguimiento.
  No representan diagnósticos clínicos.
*/
const SupportDashboardPage = () => {
  const [referrals, setReferrals] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  /*
    Extrae una lista desde distintas estructuras posibles del backend.

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
  const getReferralStudentName = (referral) => {
    return (
      referral?.alert?.student?.user?.name ||
      referral?.alert?.student?.name ||
      referral?.student?.user?.name ||
      referral?.student?.name ||
      referral?.student_name ||
      "Estudiante no disponible"
    );
  };

  /*
    Obtiene el correo del estudiante relacionado.
  */
  const getReferralStudentEmail = (referral) => {
    return (
      referral?.alert?.student?.user?.email ||
      referral?.alert?.student?.email ||
      referral?.student?.user?.email ||
      referral?.student?.email ||
      referral?.student_email ||
      "Sin correo"
    );
  };

  /*
    Obtiene el nombre del tutor que canalizó el caso.
  */
  const getReferralTutorName = (referral) => {
    return (
      referral?.referred_by?.user?.name ||
      referral?.tutor?.user?.name ||
      referral?.tutor?.name ||
      referral?.referred_by_name ||
      "Tutor no disponible"
    );
  };

  /*
    Obtiene el motivo o descripción de la canalización.
  */
  const getReferralReason = (referral) => {
    return (
      referral?.reason ||
      referral?.referral_reason ||
      referral?.description ||
      referral?.alert?.description ||
      referral?.alert?.message ||
      "Caso canalizado para seguimiento institucional."
    );
  };

  /*
    Obtiene observaciones adicionales registradas por el tutor.
  */
  const getReferralNotes = (referral) => {
    return (
      referral?.notes ||
      referral?.comment ||
      referral?.observations ||
      "Sin observaciones adicionales."
    );
  };

  /*
    Obtiene la prioridad del caso canalizado.
  */
  const getReferralPriority = (referral) => {
    return String(referral?.priority || "medium").toLowerCase();
  };

  /*
    Traduce la prioridad a texto visible.
  */
  const getReferralPriorityLabel = (referral) => {
    const priority = getReferralPriority(referral);

    if (priority === "low") {
      return "Baja";
    }

    if (priority === "medium") {
      return "Media";
    }

    if (priority === "high") {
      return "Alta";
    }

    return referral?.priority || "Media";
  };

  /*
    Define la clase visual de la prioridad.
  */
  const getReferralPriorityBadgeClass = (referral) => {
    const priority = getReferralPriority(referral);

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
    Obtiene el estado del caso.
  */
  const getReferralStatus = (referral) => {
    return String(referral?.status || "pending").toLowerCase();
  };

  /*
    Traduce el estado a texto visible.
  */
  const getReferralStatusLabel = (referral) => {
    const status = getReferralStatus(referral);

    if (status === "pending") {
      return "Pendiente";
    }

    if (status === "in_review" || status === "in_progress") {
      return "En atención";
    }

    if (status === "closed" || status === "completed") {
      return "Cerrado";
    }

    return referral?.status || "Pendiente";
  };

  /*
    Define la clase visual del estado.
  */
  const getReferralStatusBadgeClass = (referral) => {
    const status = getReferralStatus(referral);

    if (status === "pending") {
      return "badge orange";
    }

    if (status === "in_review" || status === "in_progress") {
      return "badge light-blue";
    }

    if (status === "closed" || status === "completed") {
      return "badge green";
    }

    return "badge";
  };

  /*
    Obtiene la fecha de canalización.
  */
  const getReferralDate = (referral) => {
    const rawDate =
      referral?.created_at ||
      referral?.referred_at ||
      referral?.date;

    if (!rawDate) {
      return "Sin fecha";
    }

    return new Date(rawDate).toLocaleDateString("es-MX");
  };

  /*
    Carga las canalizaciones del personal de apoyo autenticado.
  */
  const loadReferrals = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getSupportReferralsRequest();


      const referralsList = extractList(response, ["referrals"]);

      setReferrals(referralsList);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudieron cargar los casos canalizados.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando canalizaciones de apoyo:",
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
    loadReferrals();
  }, []);

  /*
    Casos pendientes.
  */
  const pendingReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      return getReferralStatus(referral) === "pending";
    });
  }, [referrals]);

  /*
    Casos en atención.
  */
  const inProgressReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      return (
        getReferralStatus(referral) === "in_review" ||
        getReferralStatus(referral) === "in_progress"
      );
    });
  }, [referrals]);

  /*
    Casos cerrados.
  */
  const closedReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      const status = getReferralStatus(referral);
      return status === "completed" || status === "closed";
    });
  }, [referrals]);

  /*
    Casos de prioridad alta.
  */
  const highPriorityReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      return getReferralPriority(referral) === "high";
    });
  }, [referrals]);

  /*
    Canalizaciones filtradas por búsqueda.
  */
  const filteredReferrals = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return referrals;
    }

    return referrals.filter((referral) => {
      const searchableText = [
        getReferralStudentName(referral),
        getReferralStudentEmail(referral),
        getReferralTutorName(referral),
        getReferralReason(referral),
        getReferralPriorityLabel(referral),
        getReferralStatusLabel(referral),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [referrals, searchTerm]);

  /*
    Obtiene los casos más recientes para el dashboard.
  */
  const recentReferrals = useMemo(() => {
    return filteredReferrals.slice(0, 6);
  }, [filteredReferrals]);

  /*
    Estado de carga.
  */
  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Apoyo / Dashboard</p>
          <h2>Dashboard de apoyo</h2>
          <p>Cargando casos canalizados...</p>
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
          <p className="breadcrumb">Apoyo / Dashboard</p>
          <h2>Dashboard de apoyo</h2>
          <p>
            Consulta casos canalizados por tutores y da seguimiento
            institucional desde el área de apoyo.
          </p>
        </div>

        <button
          type="button"
          className="secondary-action-button"
          onClick={loadReferrals}
        >
          <RefreshCw size={18} />
          Actualizar
        </button>
      </div>

      {errorMessage && <div className="form-alert error">{errorMessage}</div>}

      <div className="metrics-grid">
        <article className="metric-card">
          <div className="metric-icon blue">
            <FileHeart size={28} />
          </div>

          <div>
            <span>Total casos</span>
            <h3>{referrals.length}</h3>
            <small>Canalizaciones recibidas</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon orange">
            <Clock size={28} />
          </div>

          <div>
            <span>Pendientes</span>
            <h3>{pendingReferrals.length}</h3>
            <small>Requieren revisión</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon purple">
            <UserRoundCheck size={28} />
          </div>

          <div>
            <span>En atención</span>
            <h3>{inProgressReferrals.length}</h3>
            <small>Seguimiento activo</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon green">
            <CheckCircle2 size={28} />
          </div>

          <div>
            <span>Cerrados</span>
            <h3>{closedReferrals.length}</h3>
            <small>Atención registrada</small>
          </div>
        </article>
      </div>

      <div className="support-dashboard-grid">
        <div className="panel-card support-referrals-card">
          <div className="table-header">
            <div>
              <h3>Casos canalizados recientes</h3>
              <p>
                Mostrando {recentReferrals.length} de {referrals.length} casos.
              </p>
            </div>

            <div className="support-search">
              <Search size={18} />

              <input
                type="text"
                placeholder="Buscar estudiante, tutor o motivo..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          {recentReferrals.length === 0 ? (
            <div className="empty-summary">
              No hay casos canalizados o no coinciden con la búsqueda.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Motivo</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>

                <tbody>
                  {recentReferrals.map((referral) => (
                    <tr key={referral.id}>
                      <td>
                        <div className="user-cell">
                          <div className="table-avatar">
                            {getReferralStudentName(referral).charAt(0)}
                          </div>

                          <div>
                            <strong>{getReferralStudentName(referral)}</strong>
                            <span>{getReferralStudentEmail(referral)}</span>
                          </div>
                        </div>
                      </td>

                      <td>{getReferralReason(referral)}</td>

                      <td>
                        <span className={getReferralPriorityBadgeClass(referral)}>
                          {getReferralPriorityLabel(referral)}
                        </span>
                      </td>

                      <td>
                        <span className={getReferralStatusBadgeClass(referral)}>
                          {getReferralStatusLabel(referral)}
                        </span>
                      </td>

                      <td>{getReferralDate(referral)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="info-box">
            Los casos canalizados son registros institucionales de seguimiento.
            No representan diagnósticos ni evaluaciones clínicas.
          </div>
        </div>

        <aside className="panel-card support-summary-card">
          <h3>Resumen de apoyo</h3>
          <p>Estado general de canalizaciones recibidas.</p>

          <div className="support-summary-list">
            <div className="support-summary-item">
              <span>Prioridad alta</span>
              <strong>{highPriorityReferrals.length}</strong>
            </div>

            <div className="support-summary-item">
              <span>Pendientes</span>
              <strong>{pendingReferrals.length}</strong>
            </div>

            <div className="support-summary-item">
              <span>En atención</span>
              <strong>{inProgressReferrals.length}</strong>
            </div>

            <div className="support-summary-item">
              <span>Cerrados</span>
              <strong>{closedReferrals.length}</strong>
            </div>
          </div>

          <div className="warning-box">
            El personal de apoyo debe revisar cada caso y registrar el
            seguimiento correspondiente.
          </div>

          <div className="support-next-step-box">
            Siguiente pantalla: Casos canalizados.
          </div>
        </aside>
      </div>
    </section>
  );
};

export default SupportDashboardPage;
