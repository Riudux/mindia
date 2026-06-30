import { useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Link2,
  RefreshCw,
  Save,
  Search,
  UserCheck,
  Users,
} from "lucide-react";

import {
  createStudentTutorAssignmentRequest,
  getStudentTutorAssignmentsRequest,
  getUsersRequest,
} from "../../api/adminApi";

import "../../styles/pages/admin/AdminAssignmentsPage.css";

/*
  Página administrativa para asignar estudiantes a tutores.

  Flujo principal:
  1. Carga usuarios registrados.
  2. Filtra estudiantes y tutores.
  3. Carga asignaciones existentes.
  4. Permite seleccionar estudiante y tutor.
  5. Envía la asignación al backend.
*/
const AdminAssignmentsPage = () => {
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedTutorId, setSelectedTutorId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
    Extrae una lista desde diferentes posibles respuestas del backend.

    Esto hace que la pantalla sea más resistente si Laravel responde como:
    { users: [...] }
    { assignments: [...] }
    { data: [...] }
    [...]
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
    Obtiene el ID del rol del usuario.

    Roles usados en MindIA:
    1 = Administrador
    2 = Tutor
    3 = Personal de apoyo
    4 = Estudiante
  */
  const getRoleId = (user) => {
    return Number(user?.role_id ?? user?.role?.id ?? 0);
  };

  /*
    Obtiene el nombre del rol en caso de que el backend lo incluya.
  */
  const getRoleName = (user) => {
    return String(user?.role?.name ?? user?.role_name ?? "").toLowerCase();
  };

  /*
    Determina si un usuario pertenece al rol estudiante.
  */
  const isStudentUser = (user) => {
    const roleId = getRoleId(user);
    const roleName = getRoleName(user);

    return roleId === 4 || roleName.includes("student") || roleName.includes("estudiante");
  };

  /*
    Determina si un usuario pertenece al rol tutor.
  */
  const isTutorUser = (user) => {
    const roleId = getRoleId(user);
    const roleName = getRoleName(user);

    return roleId === 2 || roleName.includes("tutor");
  };

  /*
    Obtiene el ID real del perfil académico del estudiante.

    Ojo:
    Este no siempre es igual al ID del usuario.
    La tabla student_tutor_assignments normalmente necesita students.id.
  */
  const getStudentProfileId = (user) => {
    return user?.student?.id ?? user?.student_id ?? "";
  };

  /*
    Obtiene el ID real del perfil del tutor.

    Ojo:
    Este no siempre es igual al ID del usuario.
    La tabla student_tutor_assignments normalmente necesita tutors.id.
  */
  const getTutorProfileId = (user) => {
    return user?.tutor?.id ?? user?.tutor_id ?? "";
  };

  /*
    Carga usuarios y asignaciones desde el backend.
  */
  const loadPageData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const [usersResponse, assignmentsResponse] = await Promise.all([
        getUsersRequest(),
        getStudentTutorAssignmentsRequest(),
      ]);

      const usersList = extractList(usersResponse, ["users"]);
      const assignmentsList = extractList(assignmentsResponse, [
        "assignments",
        "student_tutor_assignments",
      ]);

      setUsers(usersList);
      setAssignments(assignmentsList);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudieron cargar los datos de asignaciones.";

      setErrorMessage(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /*
    Carga inicial de la pantalla.
  */
  useEffect(() => {
    loadPageData();
  }, []);

  /*
    Lista de estudiantes disponibles.
  */
  const students = useMemo(() => {
    return users.filter((user) => isStudentUser(user));
  }, [users]);

  /*
    Lista de tutores disponibles.
  */
  const tutors = useMemo(() => {
    return users.filter((user) => isTutorUser(user));
  }, [users]);

  /*
    Estudiantes que sí tienen ID de perfil estudiantil.

    Si un estudiante no tiene student.id, no lo usamos en el select
    porque el backend necesita el ID de la tabla students.
  */
  const selectableStudents = useMemo(() => {
    return students.filter((student) => Boolean(getStudentProfileId(student)));
  }, [students]);

  /*
    Tutores que sí tienen ID de perfil de tutor.
  */
  const selectableTutors = useMemo(() => {
    return tutors.filter((tutor) => Boolean(getTutorProfileId(tutor)));
  }, [tutors]);

  

  /*
    Obtiene el nombre del estudiante desde una asignación.

    Soporta varias estructuras posibles:
    assignment.student.user.name
    assignment.student.name
    assignment.student_name
  */
  const getAssignmentStudentName = (assignment) => {
    return (
      assignment?.student?.user?.name ||
      assignment?.student?.name ||
      assignment?.student_name ||
      "Estudiante no disponible"
    );
  };

  /*
    Obtiene el nombre del tutor desde una asignación.

    Soporta varias estructuras posibles:
    assignment.tutor.user.name
    assignment.tutor.name
    assignment.tutor_name
  */
  const getAssignmentTutorName = (assignment) => {
    return (
      assignment?.tutor?.user?.name ||
      assignment?.tutor?.name ||
      assignment?.tutor_name ||
      "Tutor no disponible"
    );
  };

  /*
    Obtiene el correo del estudiante si viene incluido en la respuesta.
  */
  const getAssignmentStudentEmail = (assignment) => {
    return (
      assignment?.student?.user?.email ||
      assignment?.student?.email ||
      assignment?.student_email ||
      "Sin correo"
    );
  };

  /*
    Obtiene el correo del tutor si viene incluido en la respuesta.
  */
  const getAssignmentTutorEmail = (assignment) => {
    return (
      assignment?.tutor?.user?.email ||
      assignment?.tutor?.email ||
      assignment?.tutor_email ||
      "Sin correo"
    );
  };

  /*
    Obtiene el estado visual de la asignación.
  */
  const getAssignmentStatus = (assignment) => {
    if (assignment?.is_active === false) {
      return "Inactiva";
    }

    if (assignment?.status) {
      return assignment.status;
    }

    return "Activa";
  };

  /*
    Filtra asignaciones para la tabla según el buscador.
  */
  const filteredAssignments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return assignments;
    }

    return assignments.filter((assignment) => {
      const studentName = getAssignmentStudentName(assignment).toLowerCase();
      const tutorName = getAssignmentTutorName(assignment).toLowerCase();

      return (
        studentName.includes(normalizedSearch) ||
        tutorName.includes(normalizedSearch)
      );
    });
  }, [assignments, searchTerm]);

  /*
    Envía la nueva asignación al backend.
  */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedStudentId || !selectedTutorId) {
      setErrorMessage("Selecciona un estudiante y un tutor.");
      setSuccessMessage("");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      await createStudentTutorAssignmentRequest({
        student_id: Number(selectedStudentId),
        tutor_id: Number(selectedTutorId),
      });

      setSuccessMessage("Asignación creada correctamente.");
      setSelectedStudentId("");
      setSelectedTutorId("");

      await loadPageData();
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null;

      const backendMessage =
        firstValidationError ||
        error.response?.data?.message ||
        "No se pudo crear la asignación.";

      setErrorMessage(backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
    Muestra un estado de carga mientras llegan los datos.
  */
  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Admin / Asignaciones</p>
          <h2>Asignar estudiante a tutor</h2>
          <p>Cargando estudiantes, tutores y asignaciones actuales...</p>
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
          <p className="breadcrumb">Admin / Asignaciones</p>
          <h2>Asignar estudiante a tutor</h2>
          <p>
            Vincula estudiantes con tutores para dar seguimiento institucional
            dentro de MindIA.
          </p>
        </div>

        <button
          type="button"
          className="secondary-action-button"
          onClick={loadPageData}
        >
          <RefreshCw size={18} />
          Actualizar
        </button>
      </div>

      <div className="metrics-grid">
        <article className="metric-card">
          <div className="metric-icon blue">
            <GraduationCap size={28} />
          </div>

          <div>
            <span>Estudiantes</span>
            <h3>{students.length}</h3>
            <small>Usuarios con rol estudiante</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon green">
            <UserCheck size={28} />
          </div>

          <div>
            <span>Tutores</span>
            <h3>{tutors.length}</h3>
            <small>Usuarios con rol tutor</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon purple">
            <Link2 size={28} />
          </div>

          <div>
            <span>Asignaciones</span>
            <h3>{assignments.length}</h3>
            <small>Relaciones registradas</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon orange">
            <Users size={28} />
          </div>

          <div>
            <span>Disponibles</span>
            <h3>{selectableStudents.length}</h3>
            <small>Estudiantes asignables</small>
          </div>
        </article>
      </div>

      {errorMessage && <div className="form-alert error">{errorMessage}</div>}

      {successMessage && (
        <div className="form-alert success">{successMessage}</div>
      )}

      <div className="assignments-grid">
        <form className="panel-card assignment-form" onSubmit={handleSubmit}>
          <h3>Nueva asignación</h3>
          <p>
            Selecciona un estudiante y el tutor que será responsable de su
            seguimiento.
          </p>

          <div className="form-section">
            <div className="form-grid-2">
              <label className="form-field">
                <span>Estudiante *</span>

                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  required
                >
                  <option value="">Selecciona un estudiante</option>

                  {selectableStudents.map((student) => (
                    <option
                      key={student.id}
                      value={getStudentProfileId(student)}
                    >
                      {student.name} - {student.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Tutor *</span>

                <select
                  value={selectedTutorId}
                  onChange={(event) => setSelectedTutorId(event.target.value)}
                  required
                >
                  <option value="">Selecciona un tutor</option>

                  {selectableTutors.map((tutor) => (
                    <option key={tutor.id} value={getTutorProfileId(tutor)}>
                      {tutor.name} - {tutor.email}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="assignment-help-box">
            <strong>Nota:</strong> La asignación permite que el tutor consulte
            información de seguimiento del estudiante según los permisos
            institucionales del sistema.
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-action-button"
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isSubmitting ? "Guardando..." : "Guardar asignación"}
            </button>
          </div>
        </form>

        <aside className="panel-card assignment-side-card">
          <h3>Resumen</h3>
          <p>Validación rápida de datos disponibles.</p>

          <ul className="assignment-check-list">
            <li className={students.length > 0 ? "allowed" : "muted"}>
              Estudiantes registrados: {students.length}
            </li>

            <li className={tutors.length > 0 ? "allowed" : "muted"}>
              Tutores registrados: {tutors.length}
            </li>

            <li className={selectableStudents.length > 0 ? "allowed" : "muted"}>
              Estudiantes con perfil académico: {selectableStudents.length}
            </li>

            <li className={selectableTutors.length > 0 ? "allowed" : "muted"}>
              Tutores con perfil activo: {selectableTutors.length}
            </li>
          </ul>

          {selectableStudents.length === 0 || selectableTutors.length === 0 ? (
            <div className="warning-box">
              Si no aparecen estudiantes o tutores seleccionables, hay que
              revisar que el endpoint de usuarios esté regresando los perfiles
              relacionados: student y tutor.
            </div>
          ) : null}
        </aside>
      </div>

      <div className="panel-card assignments-table-card">
        <div className="table-header">
          <div>
            <h3>Asignaciones registradas</h3>
            <p>Lista de relaciones estudiante-tutor existentes.</p>
          </div>

          <div className="assignment-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar estudiante o tutor..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="empty-summary">
            No hay asignaciones registradas o no coinciden con la búsqueda.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Tutor asignado</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>
                      <div className="user-cell">
                        <div className="table-avatar">
                          {getAssignmentStudentName(assignment).charAt(0)}
                        </div>

                        <div>
                          <strong>{getAssignmentStudentName(assignment)}</strong>
                          <span>{getAssignmentStudentEmail(assignment)}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="user-cell">
                        <div className="table-avatar">
                          {getAssignmentTutorName(assignment).charAt(0)}
                        </div>

                        <div>
                          <strong>{getAssignmentTutorName(assignment)}</strong>
                          <span>{getAssignmentTutorEmail(assignment)}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                        <span
                            className={
                                ["active", "activa"].includes(
                                getAssignmentStatus(assignment).toLowerCase()
                                )
                                ? "badge green"
                                : "badge red"
                            }
                            >
                            {getAssignmentStatus(assignment).toLowerCase() === "active"
                                ? "Activo"
                                : getAssignmentStatus(assignment).toLowerCase() === "inactive"
                                ? "Inactivo"
                                : getAssignmentStatus(assignment)}
                        </span>
                    </td>

                    <td>
                      {assignment.created_at
                        ? new Date(assignment.created_at).toLocaleDateString(
                            "es-MX"
                          )
                        : "Sin fecha"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminAssignmentsPage;
