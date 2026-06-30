import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileHeart,
  Filter,
  RefreshCw,
  Search,
  UserRoundCheck,
} from "lucide-react";

import {
  getSupportReferralsRequest,
  updateSupportReferralStatusRequest,
} from "../../api/supportApi";

import "../../styles/pages/support/SupportReferralsPage.css";

/*
  Pantalla "Casos canalizados".

  Esta vista permite al personal de apoyo consultar todas las canalizaciones
  recibidas, filtrarlas por estado/prioridad y actualizar el estado del caso.

  Importante:
  Los casos canalizados son registros institucionales de seguimiento.
  No representan diagnósticos clínicos.
*/
const SupportReferralsPage = () => {
  /*
    Hook de navegación.

    Se usa para abrir la pantalla de detalle del caso canalizado.
  */
  const navigate = useNavigate();

  /*
    Lista de canalizaciones recibidas desde el backend.
  */
  const [referrals, setReferrals] = useState([]);

  /*
    Estados de filtros de búsqueda.
  */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  /*
    Estados de carga y actualización.
  */
  const [isLoading, setIsLoading] = useState(true);
  const [updatingReferralId, setUpdatingReferralId] = useState(null);

  /*
    Mensajes visuales para el usuario.
  */
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
    Extrae listas desde diferentes estructuras posibles del backend.

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
    Obtiene el nombre del estudiante vinculado a la canalización.

    Se revisan varias estructuras porque el backend puede regresar:
    - referral.student.user.name
    - referral.alert.student.user.name
    - referral.student_name
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
    Obtiene el correo del estudiante vinculado a la canalización.
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
    Obtiene el tutor que canalizó el caso.
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
    Obtiene el motivo principal de canalización.
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
    Obtiene observaciones adicionales del caso.
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
    Obtiene la prioridad real de la canalización.

    Valores esperados por el backend:
    - low
    - medium
    - high
  */
  const getReferralPriority = (referral) => {
    return String(referral?.priority || "medium").toLowerCase();
  };

  /*
    Traduce la prioridad para mostrarla en español.
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
    Devuelve la clase visual según la prioridad.
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
    Obtiene el estado real de la canalización.

    Estados aceptados por tu backend:
    - pending
    - in_review
    - completed
    - cancelled
  */
  const getReferralStatus = (referral) => {
    return String(referral?.status || "pending").toLowerCase();
  };

  /*
    Traduce el estado para mostrarlo en español.

    También soporta in_progress y closed por compatibilidad visual,
    aunque tu backend actualmente usa in_review y completed.
  */
  const getReferralStatusLabel = (referral) => {
    const status = getReferralStatus(referral);

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

    return referral?.status || "Pendiente";
  };

  /*
    Devuelve la clase visual según el estado.
  */
  const getReferralStatusBadgeClass = (referral) => {
    const status = getReferralStatus(referral);

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
    Obtiene la fecha de canalización.
  */
  const getReferralDate = (referral) => {
    const rawDate =
      referral?.created_at || referral?.referral_date || referral?.referred_at || referral?.date;

    if (!rawDate) {
      return "Sin fecha";
    }

    return new Date(rawDate).toLocaleDateString("es-MX");
  };

  /*
    Carga todos los casos canalizados del personal de apoyo autenticado.
  */
  const loadReferrals = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await getSupportReferralsRequest();


      const referralsList = extractList(response, ["referrals"]);

      setReferrals(referralsList);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudieron cargar los casos canalizados.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando casos canalizados:",
        error.response?.data || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
    Carga inicial de la pantalla.
  */
  useEffect(() => {
    loadReferrals();
  }, []);

  /*
    Calcula los casos pendientes.
  */
  const pendingReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      return getReferralStatus(referral) === "pending";
    });
  }, [referrals]);

  /*
    Calcula los casos en atención.

    Aquí estaba el error:
    referrals.filter(...) necesita recibir una función callback.
  */
  const inProgressReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      const status = getReferralStatus(referral);

      return status === "in_review" || status === "in_progress";
    });
  }, [referrals]);

  /*
    Calcula los casos cerrados.
  */
  const closedReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      const status = getReferralStatus(referral);

      return status === "completed" || status === "closed";
    });
  }, [referrals]);

  /*
    Calcula los casos cancelados.
  */
  const cancelledReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      return getReferralStatus(referral) === "cancelled";
    });
  }, [referrals]);

  /*
    Calcula los casos de prioridad alta.
  */
  const highPriorityReferrals = useMemo(() => {
    return referrals.filter((referral) => {
      return getReferralPriority(referral) === "high";
    });
  }, [referrals]);

  /*
    Filtra los casos por búsqueda, estado y prioridad.
  */
  const filteredReferrals = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return referrals.filter((referral) => {
      const status = getReferralStatus(referral);
      const priority = getReferralPriority(referral);

      const searchableText = [
        getReferralStudentName(referral),
        getReferralStudentEmail(referral),
        getReferralTutorName(referral),
        getReferralReason(referral),
        getReferralNotes(referral),
        getReferralPriorityLabel(referral),
        getReferralStatusLabel(referral),
        getReferralDate(referral),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [referrals, searchTerm, statusFilter, priorityFilter]);

  /*
    Limpia filtros activos.
  */
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  /*
    Actualiza el estado de una canalización.

    Tu backend acepta:
    - pending
    - in_review
    - completed
    - cancelled
  */
  const handleStatusChange = async (referralId, newStatus) => {
    try {
      setUpdatingReferralId(referralId);
      setErrorMessage("");
      setSuccessMessage("");

      await updateSupportReferralStatusRequest(referralId, {
        status: newStatus,
      });

      setSuccessMessage("Estado del caso actualizado correctamente.");

      await loadReferrals();
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
      setUpdatingReferralId(null);
    }
  };

  /*
    Renderiza estado de carga.
  */
  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Apoyo / Casos canalizados</p>
          <h2>Casos canalizados</h2>
          <p>Cargando canalizaciones recibidas...</p>
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
          <p className="breadcrumb">Apoyo / Casos canalizados</p>
          <h2>Casos canalizados</h2>
          <p>
            Consulta, filtra y actualiza los casos canalizados al área de apoyo.
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

      {successMessage && (
        <div className="form-alert success">{successMessage}</div>
      )}

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

      {cancelledReferrals.length > 0 && (
        <div className="form-alert error">
          Casos cancelados registrados: {cancelledReferrals.length}
        </div>
      )}

      <div className="panel-card support-referrals-filters">
        <div className="support-referrals-filter-header">
          <div>
            <h3>Filtros de casos</h3>
            <p>Busca por estudiante, tutor, motivo, observación o estado.</p>
          </div>

          <button
            type="button"
            className="secondary-action-button"
            onClick={clearFilters}
          >
            <Filter size={18} />
            Limpiar filtros
          </button>
        </div>

        <div className="support-referrals-filters-grid">
          <div className="filter-input">
            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar estudiante, tutor, motivo u observaciones..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Estado: Todos</option>
            <option value="pending">Pendiente</option>
            <option value="in_review">En atención</option>
            <option value="completed">Cerrado</option>
            <option value="cancelled">Cancelado</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="all">Prioridad: Todas</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
      </div>

      <div className="panel-card support-referrals-table-card">
        <div className="table-header">
          <div>
            <h3>Listado de casos</h3>
            <p>
              Mostrando {filteredReferrals.length} de {referrals.length} casos.
            </p>
          </div>

          <div className="support-priority-summary">
            <AlertTriangle size={18} />
            Alta prioridad: {highPriorityReferrals.length}
          </div>
        </div>

        {filteredReferrals.length === 0 ? (
          <div className="empty-summary">
            No hay casos canalizados o no coinciden con los filtros.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Tutor</th>
                  <th>Motivo</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {filteredReferrals.map((referral) => (
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

                    <td>{getReferralTutorName(referral)}</td>

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

                    <td>
                      <div className="support-referral-actions">
                        <button
                          type="button"
                          className="table-action-button"
                          onClick={() =>
                            navigate(`/support/referrals/${referral.id}`)
                          }
                        >
                          <Eye size={16} />
                          Ver detalle
                        </button>

                        {getReferralStatus(referral) === "pending" && (
                          <button
                            type="button"
                            className="table-action-button"
                            disabled={updatingReferralId === referral.id}
                            onClick={() =>
                              handleStatusChange(referral.id, "in_review")
                            }
                          >
                            {updatingReferralId === referral.id
                              ? "Actualizando..."
                              : "Iniciar atención"}
                          </button>
                        )}

                        {(getReferralStatus(referral) === "in_review" ||
                          getReferralStatus(referral) === "in_progress") && (
                          <button
                            type="button"
                            className="table-action-button"
                            disabled={updatingReferralId === referral.id}
                            onClick={() =>
                              handleStatusChange(referral.id, "completed")
                            }
                          >
                            {updatingReferralId === referral.id
                              ? "Actualizando..."
                              : "Cerrar caso"}
                          </button>
                        )}

                        {(getReferralStatus(referral) === "completed" ||
                          getReferralStatus(referral) === "closed") && (
                          <span className="badge green">Finalizado</span>
                        )}

                        {getReferralStatus(referral) === "cancelled" && (
                          <span className="badge red">Cancelado</span>
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
          Los casos canalizados son registros institucionales de seguimiento. No
          representan diagnósticos ni evaluaciones clínicas.
        </div>
      </div>
    </section>
  );
};

export default SupportReferralsPage;
