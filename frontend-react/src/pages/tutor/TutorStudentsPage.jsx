import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  GraduationCap,
  RefreshCw,
  Search,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { getTutorStudentsRequest } from "../../api/tutorApi";

import "../../styles/pages/tutor/TutorStudentsPage.css";
import { useNavigate } from "react-router-dom";

/*
  Pantalla "Mis estudiantes".

  Esta vista permite que el tutor consulte de forma más completa
  los estudiantes que tiene asignados institucionalmente.

  Los datos vienen desde:
  GET /api/tutor/students
*/
const TutorStudentsPage = () => {
  const [students, setStudents] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [careerFilter, setCareerFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

    /*
    Permite navegar al detalle individual del estudiante.
    */
    const navigate = useNavigate();

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
    Normaliza el estudiante y conserva el ID real que se usará
    para abrir el detalle.

    El backend puede regresar:
    - El estudiante directamente.
    - Una asignación con student_id.
    - Una asignación que contiene student.
    */
    const normalizeStudent = (item) => {
    const studentData = item?.student || item;

    return {
        ...studentData,
        detail_id:
        studentData?.id ||
        item?.student_id ||
        item?.student?.id ||
        item?.id ||
        null,
    };
    };

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
      return String(student.semester);
    }

    return "N/A";
  };
    /*
    Obtiene el grupo académico del estudiante.

    Se revisan varias posibles propiedades porque el backend puede responder
    con group_name, group o academic_group dependiendo de cómo venga la consulta.
    */
    const getStudentGroup = (student) => {
    return (
        student?.group_name ||
        student?.group ||
        student?.academic_group ||
        "N/A"
    );
    };

    /*
    Obtiene el ID real del estudiante para navegar al detalle.

    Este ID debe corresponder a la tabla students, no a users.
    */
    const getStudentDetailId = (student) => {
    return (
        student?.detail_id ||
        student?.student_id ||
        student?.student?.id ||
        student?.id ||
        null
    );
    };


  /*
    Carga los estudiantes asignados al tutor autenticado.
  */
  const loadStudents = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getTutorStudentsRequest();

      console.log("Respuesta Mis estudiantes:", response);

      const rawStudents = extractList(response, [
        "students",
        "assigned_students",
        "assignments",
      ]);

      const normalizedStudents = rawStudents.map((item) =>
        normalizeStudent(item)
      );

      setStudents(normalizedStudents);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudieron cargar los estudiantes asignados.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando estudiantes del tutor:",
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
    loadStudents();
  }, []);

  /*
    Opciones únicas para filtro de programa académico.
  */
  const careerOptions = useMemo(() => {
    return [...new Set(students.map((student) => getStudentCareer(student)))]
      .filter(Boolean)
      .sort();
  }, [students]);

  /*
    Opciones únicas para filtro de cuatrimestre.
  */
  const semesterOptions = useMemo(() => {
    return [...new Set(students.map((student) => getStudentSemester(student)))]
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b));
  }, [students]);

  /*
    Opciones únicas para filtro de grupo.
  */
  const groupOptions = useMemo(() => {
    return [...new Set(students.map((student) => getStudentGroup(student)))]
      .filter(Boolean)
      .sort();
  }, [students]);

  /*
    Estudiantes filtrados por búsqueda, carrera, cuatrimestre y grupo.
  */
  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const studentCareer = getStudentCareer(student);
      const studentSemester = getStudentSemester(student);
      const studentGroup = getStudentGroup(student);

      const searchableText = [
        getStudentName(student),
        getStudentEmail(student),
        getStudentEnrollment(student),
        studentCareer,
        studentSemester,
        studentGroup,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesCareer =
        careerFilter === "all" || studentCareer === careerFilter;

      const matchesSemester =
        semesterFilter === "all" || studentSemester === semesterFilter;

      const matchesGroup = groupFilter === "all" || studentGroup === groupFilter;

      return matchesSearch && matchesCareer && matchesSemester && matchesGroup;
    });
  }, [students, searchTerm, careerFilter, semesterFilter, groupFilter]);

  /*
    Limpia todos los filtros activos.
  */
  const clearFilters = () => {
    setSearchTerm("");
    setCareerFilter("all");
    setSemesterFilter("all");
    setGroupFilter("all");
  };

  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Tutor / Mis estudiantes</p>
          <h2>Mis estudiantes</h2>
          <p>Cargando estudiantes asignados...</p>
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
          <p className="breadcrumb">Tutor / Mis estudiantes</p>
          <h2>Mis estudiantes</h2>
          <p>
            Consulta y filtra los estudiantes asignados a tu seguimiento
            académico.
          </p>
        </div>

        <button
          type="button"
          className="secondary-action-button"
          onClick={loadStudents}
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
            <span>Total asignados</span>
            <h3>{students.length}</h3>
            <small>Estudiantes bajo seguimiento</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon green">
            <UserRoundCheck size={28} />
          </div>

          <div>
            <span>Mostrando</span>
            <h3>{filteredStudents.length}</h3>
            <small>Resultado de filtros</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon purple">
            <GraduationCap size={28} />
          </div>

          <div>
            <span>Programas</span>
            <h3>{careerOptions.length}</h3>
            <small>Carreras detectadas</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon orange">
            <Filter size={28} />
          </div>

          <div>
            <span>Filtros</span>
            <h3>
              {[careerFilter, semesterFilter, groupFilter].filter(
                (value) => value !== "all"
              ).length}
            </h3>
            <small>Filtros activos</small>
          </div>
        </article>
      </div>

      <div className="panel-card tutor-students-filters">
        <h3>Filtros de búsqueda</h3>

        <div className="tutor-students-filters-grid">
          <div className="filter-input">
            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar por nombre, correo, matrícula o carrera..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            value={careerFilter}
            onChange={(event) => setCareerFilter(event.target.value)}
          >
            <option value="all">Programa: Todos</option>

            {careerOptions.map((career) => (
              <option key={career} value={career}>
                {career}
              </option>
            ))}
          </select>

          <select
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
          >
            <option value="all">Cuatrimestre: Todos</option>

            {semesterOptions.map((semester) => (
              <option key={semester} value={semester}>
                {semester}° cuatrimestre
              </option>
            ))}
          </select>

          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
          >
            <option value="all">Grupo: Todos</option>

            {groupOptions.map((group) => (
              <option key={group} value={group}>
                Grupo {group}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="secondary-action-button clear-student-filters-button"
          onClick={clearFilters}
        >
          Limpiar filtros
        </button>
      </div>

      <div className="panel-card tutor-students-table-card">
        <div className="table-header">
          <div>
            <h3>Estudiantes asignados</h3>
            <p>
              Mostrando {filteredStudents.length} de {students.length}{" "}
              estudiantes.
            </p>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="empty-summary">
            No hay estudiantes asignados o no coinciden con los filtros.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Matrícula</th>
                  <th>Programa académico</th>
                  <th>Cuatrimestre</th>
                  <th>Grupo</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={getStudentDetailId(student) || getStudentEmail(student)}>
                    <td>
                      <div className="user-cell">
                        <div className="table-avatar">
                          {getStudentName(student).charAt(0)}
                        </div>

                        <div>
                          <strong>{getStudentName(student)}</strong>
                          <span>{getStudentEmail(student)}</span>
                        </div>
                      </div>
                    </td>

                    <td>{getStudentEnrollment(student)}</td>

                    <td>{getStudentCareer(student)}</td>

                    <td>{getStudentSemester(student)}°</td>

                    <td>
                      <span className="badge light-blue">
                        {getStudentGroup(student)}
                      </span>
                    </td>

                    <td>
                        <button
                            type="button"
                            className="table-action-button"
                            onClick={() => {
                                const studentDetailId = getStudentDetailId(student);

                                if (!studentDetailId) {
                                console.error("No se encontró ID del estudiante:", student);
                                return;
                                }

                                navigate(`/tutor/students/${studentDetailId}`);
                            }}
                        >
                            Ver detalle
                        </button>
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

export default TutorStudentsPage;