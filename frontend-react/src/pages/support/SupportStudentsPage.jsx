import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileHeart,
  RefreshCw,
  Search,
  UserRound,
  UserRoundCheck,
} from "lucide-react";

import { getSupportReferralsRequest } from "../../api/supportApi";

import "../../styles/pages/support/SupportStudentsPage.css";

/*
  Pantalla "Estudiantes en seguimiento".

  Esta vista agrupa los casos canalizados por estudiante para que el personal
  de apoyo pueda identificar rápidamente:
  - estudiantes con canalizaciones,
  - cantidad de casos recibidos,
  - casos pendientes,
  - casos cerrados,
  - última canalización registrada.

  Importante:
  La información mostrada es de seguimiento institucional.
  No representa diagnósticos clínicos.
*/
const SupportStudentsPage = () => {
  /*
    Hook de navegación para abrir el detalle del caso más reciente.
  */
  const navigate = useNavigate();

  /*
    Lista completa de canalizaciones recibidas desde el backend.
  */
  const [referrals, setReferrals] = useState([]);

  /*
    Estado del buscador.
  */
  const [searchTerm, setSearchTerm] = useState("");

  /*
    Estados visuales de carga y error.
  */
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /*
    Extrae arreglos desde diferentes estructuras posibles del backend.

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
    Obtiene el ID del estudiante desde distintas estructuras posibles.
  */
  const getStudentId = (referral) => {
    return (
      referral?.student?.id ||
      referral?.alert?.student?.id ||
      referral?.student_id ||
      null
    );
  };

  /*
    Obtiene el nombre del estudiante relacionado con una canalización.
  */
  const getStudentName = (referral) => {
    return (
      referral?.student?.user?.name ||
      referral?.student?.name ||
      referral?.alert?.student?.user?.name ||
      referral?.alert?.student?.name ||
      referral?.student_name ||
      "Estudiante no disponible"
    );
  };

  /*
    Obtiene el correo del estudiante relacionado.
  */
  const getStudentEmail = (referral) => {
    return (
      referral?.student?.user?.email ||
      referral?.student?.email ||
      referral?.alert?.student?.user?.email ||
      referral?.alert?.student?.email ||
      referral?.student_email ||
      "Sin correo"
    );
  };

  /*
    Obtiene la matrícula o clave institucional.
  */
  const getStudentEnrollment = (referral) => {
    return (
      referral?.student?.enrollment_key ||
      referral?.student?.institutional_id ||
      referral?.alert?.student?.enrollment_key ||
      referral?.alert?.student?.institutional_id ||
      "Sin matrícula"
    );
  };

  /*
    Obtiene el programa académico del estudiante.
  */
  const getStudentCareer = (referral) => {
    return (
      referral?.student?.career ||
      referral?.student?.program ||
      referral?.alert?.student?.career ||
      referral?.alert?.student?.program ||
      "Sin programa académico"
    );
  };

  /*
    Obtiene el tutor que canalizó el caso.
  */
  const getTutorName = (referral) => {
    return (
      referral?.tutor?.user?.name ||
      referral?.tutor?.name ||
      referral?.referred_by?.user?.name ||
      referral?.referred_by_name ||
      "Tutor no disponible"
    );
  };

  /*
    Obtiene el estado real de una canalización.

    Estados aceptados en el backend:
    - pending
    - in_review
    - completed
    - cancelled
  */
  const getReferralStatus = (referral) => {
    return String(referral?.status || "pending").toLowerCase();
  };

  /*
    Obtiene la prioridad real de una canalización.
  */
  const getReferralPriority = (referral) => {
    return String(referral?.priority || "medium").toLowerCase();
  };

  /*
    Traduce prioridad a español.
  */
  const getPriorityLabel = (priority) => {
    if (priority === "low") {
      return "Baja";
    }

    if (priority === "medium") {
      return "Media";
    }

    if (priority === "high") {
      return "Alta";
    }

    return "Media";
  };

  /*
    Devuelve clase visual para prioridad.
  */
  const getPriorityBadgeClass = (priority) => {
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
    Obtiene la fecha de canalización.
  */
  const getReferralDate = (referral) => {
    const rawDate =
      referral?.created_at ||
      referral?.referral_date ||
      referral?.referred_at ||
      referral?.date;

    if (!rawDate) {
      return null;
    }

    return new Date(rawDate);
  };

  /*
    Formatea una fecha para mostrarla en español.
  */
  const formatDate = (date) => {
    if (!date) {
      return "Sin fecha";
    }

    return date.toLocaleDateString("es-MX");
  };

  /*
    Carga las canalizaciones asignadas al personal de apoyo autenticado.
  */
  const loadReferrals = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getSupportReferralsRequest();

      console.log("Estudiantes en seguimiento - referrals:", response);

      const referralsList = extractList(response, ["referrals"]);

      setReferrals(referralsList);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudieron cargar los estudiantes en seguimiento.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando estudiantes en seguimiento:",
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
    Agrupa canalizaciones por estudiante.

    Cada estudiante queda con:
    - total de casos,
    - casos pendientes,
    - casos en atención,
    - casos cerrados,
    - prioridad más alta,
    - caso más reciente.
  */
  const students = useMemo(() => {
    const groupedStudents = new Map();

    referrals.forEach((referral) => {
      const studentId = getStudentId(referral);
      const studentEmail = getStudentEmail(referral);
      const fallbackKey = `${getStudentName(referral)}-${studentEmail}`;
      const studentKey = studentId || studentEmail || fallbackKey;

      if (!groupedStudents.has(studentKey)) {
        groupedStudents.set(studentKey, {
          key: studentKey,
          id: studentId,
          name: getStudentName(referral),
          email: studentEmail,
          enrollment: getStudentEnrollment(referral),
          career: getStudentCareer(referral),
          tutorName: getTutorName(referral),
          referrals: [],
        });
      }

      groupedStudents.get(studentKey).referrals.push(referral);
    });

    return Array.from(groupedStudents.values()).map((student) => {
      const pendingCount = student.referrals.filter((referral) => {
        return getReferralStatus(referral) === "pending";
      }).length;

      const inReviewCount = student.referrals.filter((referral) => {
        const status = getReferralStatus(referral);

        return status === "in_review" || status === "in_progress";
      }).length;

      const completedCount = student.referrals.filter((referral) => {
        const status = getReferralStatus(referral);

        return status === "completed" || status === "closed";
      }).length;

      const hasHighPriority = student.referrals.some((referral) => {
        return getReferralPriority(referral) === "high";
      });

      const hasMediumPriority = student.referrals.some((referral) => {
        return getReferralPriority(referral) === "medium";
      });

      const priority = hasHighPriority
        ? "high"
        : hasMediumPriority
        ? "medium"
        : "low";

      const sortedReferrals = [...student.referrals].sort((a, b) => {
        const dateA = getReferralDate(a)?.getTime() || 0;
        const dateB = getReferralDate(b)?.getTime() || 0;

        return dateB - dateA;
      });

      const latestReferral = sortedReferrals[0] || null;

      return {
        ...student,
        totalReferrals: student.referrals.length,
        pendingCount,
        inReviewCount,
        completedCount,
        priority,
        latestReferral,
        latestDate: getReferralDate(latestReferral),
      };
    });
  }, [referrals]);

  /*
    Estudiantes con casos pendientes o en atención.
  */
  const activeStudents = useMemo(() => {
    return students.filter((student) => {
      return student.pendingCount > 0 || student.inReviewCount > 0;
    });
  }, [students]);

  /*
    Estudiantes con prioridad alta.
  */
  const highPriorityStudents = useMemo(() => {
    return students.filter((student) => student.priority === "high");
  }, [students]);

  /*
    Estudiantes con todos sus casos cerrados.
  */
  const completedStudents = useMemo(() => {
    return students.filter((student) => {
      return (
        student.totalReferrals > 0 &&
        student.completedCount === student.totalReferrals
      );
    });
  }, [students]);

  /*
    Aplica búsqueda por nombre, correo, matrícula, carrera o tutor.
  */
  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) => {
      const searchableText = [
        student.name,
        student.email,
        student.enrollment,
        student.career,
        student.tutorName,
        getPriorityLabel(student.priority),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [students, searchTerm]);

  /*
    Estado de carga.
  */
  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Apoyo / Estudiantes en seguimiento</p>
          <h2>Estudiantes en seguimiento</h2>
          <p>Cargando estudiantes relacionados con canalizaciones...</p>
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
          <p className="breadcrumb">Apoyo / Estudiantes en seguimiento</p>
          <h2>Estudiantes en seguimiento</h2>
          <p>
            Consulta estudiantes que cuentan con casos canalizados o atenciones
            registradas por el área de apoyo.
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
            <UserRound size={28} />
          </div>

          <div>
            <span>Estudiantes</span>
            <h3>{students.length}</h3>
            <small>Con casos canalizados</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon orange">
            <Clock size={28} />
          </div>

          <div>
            <span>Seguimiento activo</span>
            <h3>{activeStudents.length}</h3>
            <small>Pendientes o en atención</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon red">
            <FileHeart size={28} />
          </div>

          <div>
            <span>Prioridad alta</span>
            <h3>{highPriorityStudents.length}</h3>
            <small>Requieren mayor atención</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon green">
            <CheckCircle2 size={28} />
          </div>

          <div>
            <span>Casos cerrados</span>
            <h3>{completedStudents.length}</h3>
            <small>Todos sus casos finalizados</small>
          </div>
        </article>
      </div>

      <div className="panel-card support-students-filter-card">
        <h3>Filtro de estudiantes</h3>
        <p>Busca por nombre, correo, matrícula, carrera o tutor.</p>

        <div className="support-students-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Buscar estudiante, matrícula, carrera o tutor..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      <div className="panel-card support-students-list-card">
        <div className="table-header">
          <div>
            <h3>Listado de estudiantes</h3>
            <p>
              Mostrando {filteredStudents.length} de {students.length}{" "}
              estudiantes.
            </p>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="empty-summary">
            No hay estudiantes en seguimiento o no coinciden con la búsqueda.
          </div>
        ) : (
          <div className="support-students-grid">
            {filteredStudents.map((student) => (
              <article className="support-student-card" key={student.key}>
                <div className="support-student-card-header">
                  <div className="support-student-avatar">
                    {student.name.charAt(0)}
                  </div>

                  <div>
                    <h3>{student.name}</h3>
                    <p>{student.email}</p>
                  </div>
                </div>

                <div className="support-student-tags">
                  <span>{student.enrollment}</span>
                  <span>{student.career}</span>
                </div>

                <div className="support-student-info-grid">
                  <div>
                    <span>Total casos</span>
                    <strong>{student.totalReferrals}</strong>
                  </div>

                  <div>
                    <span>Pendientes</span>
                    <strong>{student.pendingCount}</strong>
                  </div>

                  <div>
                    <span>En atención</span>
                    <strong>{student.inReviewCount}</strong>
                  </div>

                  <div>
                    <span>Cerrados</span>
                    <strong>{student.completedCount}</strong>
                  </div>
                </div>

                <div className="support-student-meta">
                  <div>
                    <span>Tutor</span>
                    <strong>{student.tutorName}</strong>
                  </div>

                  <div>
                    <span>Última canalización</span>
                    <strong>{formatDate(student.latestDate)}</strong>
                  </div>
                </div>

                <div className="support-student-card-footer">
                  <span className={getPriorityBadgeClass(student.priority)}>
                    Prioridad {getPriorityLabel(student.priority)}
                  </span>

                  {student.latestReferral ? (
                    <button
                      type="button"
                      className="table-action-button"
                      onClick={() =>
                        navigate(
                          `/support/referrals/${student.latestReferral.id}`
                        )
                      }
                    >
                      <Eye size={16} />
                      Ver caso reciente
                    </button>
                  ) : (
                    <span className="badge">Sin caso</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="info-box">
          Los estudiantes mostrados tienen canalizaciones institucionales
          registradas. Esta información no representa diagnósticos ni
          evaluaciones clínicas.
        </div>
      </div>
    </section>
  );
};

export default SupportStudentsPage;