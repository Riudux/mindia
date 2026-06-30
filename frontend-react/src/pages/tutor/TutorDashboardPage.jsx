import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  GraduationCap,
  RefreshCw,
  Search,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getTutorAlertsRequest,
  getTutorStudentsRequest,
} from "../../api/tutorApi";

import "../../styles/pages/tutor/TutorDashboardPage.css";

/*
  Dashboard principal del tutor.

  Esta pantalla consume datos reales del backend:
  - GET /api/tutor/students
  - GET /api/tutor/alerts

  Importante:
  Los datos mostrados son indicadores institucionales de seguimiento,
  no diagnósticos ni evaluaciones clínicas.
*/
const TutorDashboardPage = () => {
  /*
    Hook de navegación para abrir el detalle del estudiante desde el dashboard.
  */
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  /*
    Extrae una lista desde diferentes posibles estructuras del backend.

    Soporta respuestas como:
    - [...]
    - { students: [...] }
    - { alerts: [...] }
    - { data: [...] }
    - { assigned_students: [...] }
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
    Normaliza cada estudiante recibido.

    Algunos endpoints pueden devolver directamente el estudiante:
    { id, user, career, semester }

    Otros pueden devolver la asignación:
    { id, student: { id, user, career } }

    Esta función permite usar ambos formatos sin romper la pantalla.
  */
  const normalizeStudent = (item) => {
    return item?.student || item;
  };

  /*
    Carga estudiantes asignados y alertas del tutor autenticado.
  */
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [studentsResponse, alertsResponse] = await Promise.all([
        getTutorStudentsRequest(),
        getTutorAlertsRequest(),
      ]);
      const rawStudents = extractList(studentsResponse, [
        "students",
        "assigned_students",
        "assignments",
      ]);

      const rawAlerts = extractList(alertsResponse, ["alerts"]);

      const normalizedStudents = rawStudents.map((item) =>
        normalizeStudent(item)
      );

      setStudents(normalizedStudents);
      setAlerts(rawAlerts);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudo cargar la información del dashboard del tutor.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando dashboard de tutor:",
        error.response?.data || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
    Ejecuta la carga inicial cuando entra a la pantalla.
  */
  useEffect(() => {
    loadDashboardData();
  }, []);

  /*
    Obtiene el nombre del estudiante.
  */
  const getStudentName = (student) => {
    return (
      student?.user?.name ||
      student?.name ||
      student?.student_name ||
      "Estudiante sin nombre"
    );
  };

  /*
    Obtiene el correo del estudiante.
  */
  const getStudentEmail = (student) => {
    return (
      student?.user?.email ||
      student?.email ||
      student?.student_email ||
      "Sin correo"
    );
  };

  /*
    Obtiene la matrícula o clave institucional.
  */
  const getStudentEnrollment = (student) => {
    return (
      student?.enrollment_key ||
      student?.institutional_id ||
      student?.student_code ||
      "Sin matrícula"
    );
  };

  /*
    Obtiene el programa académico.
  */
  const getStudentCareer = (student) => {
    return student?.career || student?.program || "Sin programa académico";
  };

  /*
    Obtiene el cuatrimestre.
  */
  const getStudentSemester = (student) => {
    if (student?.semester === 0 || student?.semester) {
      return student.semester;
    }

    return "N/A";
  };

  /*
    Obtiene el grupo académico.
  */
  const getStudentGroup = (student) => {
    return student?.group_name || student?.group || "N/A";
  };

  /*
    Filtra estudiantes por nombre, correo, matrícula o carrera.
  */
  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) => {
      const searchableText = [
        getStudentName(student),
        getStudentEmail(student),
        getStudentEnrollment(student),
        getStudentCareer(student),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [students, searchTerm]);

  /*
    Alertas pendientes de revisión.
  */
  const pendingAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const status = String(alert?.status || "").toLowerCase();

      return (
        status === "pending" ||
        status === "pendiente" ||
        status === "open" ||
        status === "abierta"
      );
    });
  }, [alerts]);

  /*
    Alertas revisadas o cerradas.
  */
  const reviewedAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const status = String(alert?.status || "").toLowerCase();

      return (
        status === "reviewed" ||
        status === "revisada" ||
        status === "closed" ||
        status === "cerrada"
      );
    });
  }, [alerts]);

  /*
    Alertas de prioridad alta.

    Esto representa prioridad institucional de seguimiento,
    no diagnóstico.
  */
  const highPriorityAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const riskLevel = String(
        alert?.risk_level || alert?.priority || alert?.level || ""
      ).toLowerCase();

      return (
        riskLevel === "high" ||
        riskLevel === "alto" ||
        riskLevel === "critical" ||
        riskLevel === "crítico"
      );
    });
  }, [alerts]);

  /*
    Pantalla mientras se cargan los datos.
  */
  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Dashboard / Tutor</p>
          <h2>Dashboard de tutor</h2>
          <p>Cargando estudiantes asignados y alertas de seguimiento...</p>
        </div>

        <div className="panel-card">
          <div className="placeholder-box">Cargando información...</div>
        </div>
      </section>
    );
  }

  /*
    Obtiene el ID correcto del estudiante para abrir su detalle.

    El endpoint del backend espera el ID de la tabla students, no el user_id
    ni el ID de la asignación tutor-estudiante.
  */
  const getStudentDetailId = (student) => {
    return (
      student?.student?.id ||
      student?.student_id ||
      student?.id ||
      null
    );
  };

  return (
    <section>
      <div className="page-header-with-actions page-header">
        <div>
          <p className="breadcrumb">Dashboard / Tutor</p>
          <h2>Dashboard de tutor</h2>
          <p>
            Consulta estudiantes asignados, alertas recientes y seguimiento
            institucional pendiente.
          </p>
        </div>

        <button
          type="button"
          className="secondary-action-button"
          onClick={loadDashboardData}
        >
          <RefreshCw size={18} />
          Actualizar
        </button>
      </div>

      {errorMessage && <div className="form-alert error">{errorMessage}</div>}

      <div className="metrics-grid">
        <article className="metric-card">
          <div className="metric-icon blue">
            <Users size={28} />
          </div>

          <div>
            <span>Estudiantes asignados</span>
            <h3>{students.length}</h3>
            <small>Seguimiento activo</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon orange">
            <Clock size={28} />
          </div>

          <div>
            <span>Alertas pendientes</span>
            <h3>{pendingAlerts.length}</h3>
            <small>Requieren revisión</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon purple">
            <AlertTriangle size={28} />
          </div>

          <div>
            <span>Prioridad alta</span>
            <h3>{highPriorityAlerts.length}</h3>
            <small>Indicadores de seguimiento</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon green">
            <CheckCircle2 size={28} />
          </div>

          <div>
            <span>Alertas revisadas</span>
            <h3>{reviewedAlerts.length}</h3>
            <small>Con seguimiento registrado</small>
          </div>
        </article>
      </div>

      <div className="tutor-dashboard-grid">
        <div className="panel-card tutor-students-card">
          <div className="table-header">
            <div>
              <h3>Mis estudiantes asignados</h3>
              <p>Estudiantes bajo responsabilidad académica del tutor.</p>
            </div>

            <div className="tutor-search">
              <Search size={18} />

              <input
                type="text"
                placeholder="Buscar estudiante..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="empty-summary">
              No hay estudiantes asignados o no coinciden con la búsqueda.
            </div>
          ) : (
            <div className="tutor-student-list">
              {filteredStudents.map((student) => (
                <article
                  className="tutor-student-card"
                  key={student.id || student.student_id || getStudentEmail(student)}
                >
                  <div className="tutor-student-avatar">
                    {getStudentName(student).charAt(0)}
                  </div>

                  <div className="tutor-student-info">
                    <strong>{getStudentName(student)}</strong>
                    <span>{getStudentEmail(student)}</span>

                    <div className="tutor-student-tags">
                      <small>{getStudentEnrollment(student)}</small>
                      <small>{getStudentCareer(student)}</small>
                      <small>{getStudentSemester(student)}° cuatrimestre</small>
                      <small>Grupo {getStudentGroup(student)}</small>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="table-action-button"
                    disabled={!getStudentDetailId(student)}
                    onClick={() =>
                      navigate(`/tutor/students/${getStudentDetailId(student)}`)
                    }
                  >
                    Ver detalle
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="panel-card tutor-summary-card">
          <h3>Resumen de seguimiento</h3>
          <p>Estado general de atención del tutor.</p>

          <div className="tutor-summary-list">
            <div className="tutor-summary-item">
              <div className="tutor-summary-icon blue">
                <GraduationCap size={20} />
              </div>

              <div>
                <span>Estudiantes asignados</span>
                <strong>{students.length}</strong>
              </div>
            </div>

            <div className="tutor-summary-item">
              <div className="tutor-summary-icon orange">
                <Clock size={20} />
              </div>

              <div>
                <span>Pendientes de revisión</span>
                <strong>{pendingAlerts.length}</strong>
              </div>
            </div>

            <div className="tutor-summary-item">
              <div className="tutor-summary-icon green">
                <UserRoundCheck size={20} />
              </div>

              <div>
                <span>Revisadas</span>
                <strong>{reviewedAlerts.length}</strong>
              </div>
            </div>
          </div>

          <div className="info-box">
            Los datos mostrados son indicadores institucionales de seguimiento.
            No representan diagnósticos ni evaluaciones clínicas.
          </div>
        </aside>
      </div>
    </section>
  );
};

export default TutorDashboardPage;
