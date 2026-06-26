// Importamos useEffect para cargar los datos del usuario al abrir la pantalla.
// Importamos useState para manejar los datos editables del formulario.
import { useEffect, useState } from "react";

// Importamos hooks de React Router.
// useNavigate permite cambiar de pantalla.
// useParams permite leer el ID del usuario desde la URL.
import { useNavigate, useParams } from "react-router-dom";

// Importamos iconos visuales usados en la pantalla.
import {
  ArrowLeft,
  GraduationCap,
  HeartHandshake,
  Save,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";

// Importamos el layout base del dashboard.
import DashboardLayout from "../../layouts/DashboardLayout";

// Importamos los estilos específicos de la página de edición de usuarios.
import "../../styles/pages/admin/AdminUserFormPage.css";

// Importamos las funciones que consumen los endpoints del backend.
import {
  getUserRequest,
  updateUserRequest,
  updateUserStatusRequest,
} from "../../api/adminApi";

/*
  ROLE_OPTIONS

  Roles disponibles para editar un usuario.

  Los valores corresponden a los role_id del backend:
  1 = admin
  2 = tutor
  3 = support
  4 = student
*/
const ROLE_OPTIONS = [
  {
    value: 1,
    label: "Administrador",
  },
  {
    value: 2,
    label: "Tutor",
  },
  {
    value: 3,
    label: "Apoyo psicológico",
  },
  {
    value: 4,
    label: "Estudiante",
  },
];

/*
  ROLE_LABELS

  Convierte role_id a texto visible.
*/
const ROLE_LABELS = {
  1: "Administrador",
  2: "Tutor",
  3: "Apoyo psicológico",
  4: "Estudiante",
};

/*
  STUDENT_CAREER_GROUPS

  Opciones reales de oferta académica de UNIPOLI Durango.

  BIS se maneja como una variante del programa académico, no como grupo.
  El grupo académico se mantiene como A, B, C o D.
*/
const STUDENT_CAREER_GROUPS = [
  {
    groupLabel: "Técnico Superior Universitario (TSU)",
    options: [
      {
        value: "TSU - Desarrollo de Software Multiplataforma",
        label: "Desarrollo de Software Multiplataforma",
      },
      {
        value: "TSU - Desarrollo de Software Multiplataforma (BIS)",
        label: "Desarrollo de Software Multiplataforma (BIS)",
      },
      {
        value: "TSU - Entornos Virtuales y Negocios Digitales",
        label: "Entornos Virtuales y Negocios Digitales",
      },
      {
        value: "TSU - Entornos Virtuales y Negocios Digitales (BIS)",
        label: "Entornos Virtuales y Negocios Digitales (BIS)",
      },
      {
        value: "TSU - Infraestructura de Redes Digitales",
        label: "Infraestructura de Redes Digitales",
      },
      {
        value: "TSU - Inteligencia Artificial",
        label: "Inteligencia Artificial",
      },
      {
        value: "TSU - Inteligencia Artificial (BIS)",
        label: "Inteligencia Artificial (BIS)",
      },
      {
        value: "TSU - Ciencia de Datos",
        label: "Ciencia de Datos",
      },
      {
        value: "TSU - Seguridad en Redes",
        label: "Seguridad en Redes",
      },
      {
        value: "TSU - Gestión Ambiental",
        label: "Gestión Ambiental",
      },
      {
        value: "TSU - Biotecnología",
        label: "Biotecnología",
      },
      {
        value: "TSU - Procesos de Fabricación",
        label: "Procesos de Fabricación",
      },
      {
        value: "TSU - Sistemas de Gestión de Calidad",
        label: "Sistemas de Gestión de Calidad",
      },
      {
        value: "TSU - Automotriz",
        label: "Automotriz",
      },
      {
        value: "TSU - Emprendimiento, Formulación y Evaluación de Proyectos",
        label: "Emprendimiento, Formulación y Evaluación de Proyectos",
      },
      {
        value: "TSU - Emprendimiento, Formulación y Evaluación de Proyectos (BIS)",
        label: "Emprendimiento, Formulación y Evaluación de Proyectos (BIS)",
      },
      {
        value: "TSU - Gestión del Capital Humano",
        label: "Gestión del Capital Humano",
      },
      {
        value: "TSU - Gestión del Capital Humano (BIS)",
        label: "Gestión del Capital Humano (BIS)",
      },
      {
        value: "TSU - Construcción",
        label: "Construcción",
      },
    ],
  },
  {
    groupLabel: "Licenciaturas",
    options: [
      {
        value: "Licenciatura - Administración",
        label: "Administración",
      },
    ],
  },
  {
    groupLabel: "Ingenierías",
    options: [
      {
        value: "Ingeniería - Tecnologías de Información e Innovación Digital",
        label: "Tecnologías de Información e Innovación Digital",
      },
      {
        value: "Ingeniería - Ciberseguridad",
        label: "Ciberseguridad",
      },
      {
        value: "Ingeniería - Ambiental y Sustentabilidad",
        label: "Ambiental y Sustentabilidad",
      },
      {
        value: "Ingeniería - Biotecnología",
        label: "Biotecnología",
      },
      {
        value: "Ingeniería - Manufactura Avanzada",
        label: "Manufactura Avanzada",
      },
      {
        value: "Ingeniería - Industrial",
        label: "Industrial",
      },
      {
        value: "Ingeniería - Civil",
        label: "Civil",
      },
    ],
  },
];

/*
  Cuatrimestres normales.

  Se usan cuando el programa académico no es BIS.
*/
const STUDENT_QUARTER_OPTIONS = [
  {
    value: "1",
    label: "1.er cuatrimestre",
  },
  {
    value: "2",
    label: "2.º cuatrimestre",
  },
  {
    value: "3",
    label: "3.er cuatrimestre",
  },
  {
    value: "4",
    label: "4.º cuatrimestre",
  },
  {
    value: "5",
    label: "5.º cuatrimestre",
  },
  {
    value: "6",
    label: "6.º cuatrimestre - Estadía TSU",
  },
  {
    value: "7",
    label: "7.º cuatrimestre",
  },
  {
    value: "8",
    label: "8.º cuatrimestre",
  },
  {
    value: "9",
    label: "9.º cuatrimestre",
  },
  {
    value: "10",
    label: "10.º cuatrimestre - Estadía Ingeniería/Licenciatura",
  },
];

/*
  Cuatrimestres para modalidad BIS.

  Incluye cuatrimestre 0 para inglés intensivo.
*/
const STUDENT_BIS_QUARTER_OPTIONS = [
  {
    value: "0",
    label: "0 - BIS / Inglés intensivo",
  },
  ...STUDENT_QUARTER_OPTIONS,
];

/*
  Grupos reales para estudiantes.

  BIS no es grupo.
  El grupo académico solamente será A, B, C o D.
*/
const STUDENT_GROUP_OPTIONS = ["A", "B", "C", "D"];

/*
  Áreas para tutores.
*/
const TUTOR_AREA_OPTIONS = [
  "Tutor académico",
  "Coordinación académica",
  "Orientación educativa",
  "Trabajo social",
  "Psicología",
];

/*
  Áreas para personal de apoyo.
*/
const SUPPORT_AREA_OPTIONS = [
  "Apoyo psicológico",
  "Orientación educativa",
  "Trabajo social",
  "Servicios escolares",
];

/*
  Áreas para administrador.
*/
const ADMIN_AREA_OPTIONS = [
  "Administración",
  "Dirección académica",
  "Control escolar",
  "Coordinación institucional",
];

/*
  Departamentos generales para tutor, apoyo y administrador.
*/
const DEPARTMENT_OPTIONS = [
  "Académico",
  "Administrativo",
  "Servicios escolares",
  "Apoyo institucional",
  "Orientación",
  "Psicología",
];

/*
  getUserFromResponse

  Normaliza la respuesta del backend.

  El usuario puede venir como:
  - response.user
  - response.data
  - response directamente
*/
const getUserFromResponse = (responseData) => {
  if (responseData?.user) {
    return responseData.user;
  }

  if (responseData?.data) {
    return responseData.data;
  }

  return responseData;
};

/*
  getProfileFromUser

  Obtiene datos relacionados del usuario.

  Dependiendo del rol, Laravel puede mandar:
  - user.student
  - user.tutor
  - user.support_staff

  Esta función permite leer datos extra como:
  - enrollment_key
  - employee_key
  - career
  - semester
  - group_name
  - area
  - department
*/
const getProfileFromUser = (user) => {
  return (
    user?.student ||
    user?.tutor ||
    user?.support_staff ||
    user?.supportStaff ||
    {}
  );
};

/*
  getRoleIdFromUser

  Obtiene el role_id aunque el backend mande el rol de diferentes formas.
*/
const getRoleIdFromUser = (user) => {
  if (user?.role_id) {
    return Number(user.role_id);
  }

  if (user?.role?.id) {
    return Number(user.role.id);
  }

  if (typeof user?.role === "string") {
    const roleText = user.role.toLowerCase();

    if (roleText.includes("admin")) {
      return 1;
    }

    if (roleText.includes("tutor")) {
      return 2;
    }

    if (roleText.includes("support") || roleText.includes("apoyo")) {
      return 3;
    }

    if (roleText.includes("student") || roleText.includes("estudiante")) {
      return 4;
    }
  }

  return 4;
};

/*
  getUserStatus

  Obtiene si el usuario está activo.

  Soporta:
  - is_active
  - active
  - status
*/
const getUserStatus = (user) => {
  if (typeof user?.is_active === "boolean") {
    return user.is_active;
  }

  if (typeof user?.active === "boolean") {
    return user.active;
  }

  if (typeof user?.status === "string") {
    return user.status.toLowerCase() === "active";
  }

  return true;
};

/*
  isBisProgram

  Detecta si el programa académico es modalidad BIS.
*/
const isBisProgram = (careerOrArea) => {
  return careerOrArea.includes("(BIS)");
};

/*
  getCareerOrAreaOptions

  Devuelve opciones para Programa académico / área según el rol.
*/
const getCareerOrAreaOptions = (roleId) => {
  if (Number(roleId) === 4) {
    return STUDENT_CAREER_GROUPS;
  }

  if (Number(roleId) === 2) {
    return TUTOR_AREA_OPTIONS;
  }

  if (Number(roleId) === 3) {
    return SUPPORT_AREA_OPTIONS;
  }

  if (Number(roleId) === 1) {
    return ADMIN_AREA_OPTIONS;
  }

  return [];
};

/*
  getSemesterOrDepartmentOptions

  Devuelve opciones para Cuatrimestre / departamento.

  Para estudiantes:
  - Si es BIS, muestra 0 al 10.
  - Si no es BIS, muestra 1 al 10.
*/
const getSemesterOrDepartmentOptions = (roleId, careerOrArea) => {
  if (Number(roleId) === 4) {
    return isBisProgram(careerOrArea)
      ? STUDENT_BIS_QUARTER_OPTIONS
      : STUDENT_QUARTER_OPTIONS;
  }

  return DEPARTMENT_OPTIONS;
};

/*
  getAcademicLabels

  Cambia etiquetas del formulario según el rol.
*/
const getAcademicLabels = (roleId) => {
  if (Number(roleId) === 4) {
    return {
      firstLabel: "Programa académico",
      secondLabel: "Cuatrimestre",
      firstPlaceholder: "Selecciona un programa académico",
      secondPlaceholder: "Selecciona un cuatrimestre",
      idLabel: "Matrícula",
    };
  }

  if (Number(roleId) === 2) {
    return {
      firstLabel: "Área académica",
      secondLabel: "Departamento",
      firstPlaceholder: "Selecciona un área académica",
      secondPlaceholder: "Selecciona un departamento",
      idLabel: "Clave de empleado",
    };
  }

  if (Number(roleId) === 3) {
    return {
      firstLabel: "Área de apoyo",
      secondLabel: "Departamento",
      firstPlaceholder: "Selecciona un área de apoyo",
      secondPlaceholder: "Selecciona un departamento",
      idLabel: "Clave de empleado",
    };
  }

  return {
    firstLabel: "Área administrativa",
    secondLabel: "Departamento",
    firstPlaceholder: "Selecciona un área administrativa",
    secondPlaceholder: "Selecciona un departamento",
    idLabel: "ID institucional",
  };
};

function AdminEditUserPage() {
  // Obtenemos el ID desde la URL.
  const { id } = useParams();

  // Hook para navegar.
  const navigate = useNavigate();

  // Usuario original cargado desde el backend.
  const [user, setUser] = useState(null);

  // Datos generales de cuenta.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(4);
  const [isActive, setIsActive] = useState(true);

  // Datos personales y académicos/institucionales.
  const [institutionalId, setInstitutionalId] = useState("");
  const [phone, setPhone] = useState("");
  const [careerOrArea, setCareerOrArea] = useState("");
  const [semesterOrDepartment, setSemesterOrDepartment] = useState("");
  const [groupName, setGroupName] = useState("");

  // Estados de interfaz.
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Opciones y etiquetas dinámicas según rol.
  const careerOrAreaOptions = getCareerOrAreaOptions(roleId);

  const semesterOrDepartmentOptions = getSemesterOrDepartmentOptions(
    roleId,
    careerOrArea
  );

  const academicLabels = getAcademicLabels(roleId);

  /*
    loadUser

    Carga el usuario seleccionado con:
    GET /api/users/{user}
  */
  const loadUser = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      // Pedimos el usuario al backend.
      const responseData = await getUserRequest(id);

      // Normalizamos respuesta.
      const userData = getUserFromResponse(responseData);

      // Obtenemos datos del perfil relacionado.
      const profileData = getProfileFromUser(userData);

      // Detectamos rol y estado.
      const detectedRoleId = getRoleIdFromUser(userData);
      const detectedStatus = getUserStatus(userData);

      // Guardamos usuario base.
      setUser(userData);

      // Llenamos datos generales.
      setName(userData?.name || "");
      setEmail(userData?.email || "");
      setRoleId(detectedRoleId);
      setIsActive(detectedStatus);

      // Llenamos matrícula o clave de empleado.
      setInstitutionalId(
        profileData?.enrollment_key ||
          profileData?.employee_key ||
          userData?.enrollment_key ||
          userData?.employee_key ||
          ""
      );

      // Llenamos teléfono si existe.
      setPhone(profileData?.phone || userData?.phone || "");

      // Llenamos carrera o área.
      setCareerOrArea(
        profileData?.career ||
          profileData?.area ||
          userData?.career ||
          userData?.area ||
          ""
      );

      // Llenamos cuatrimestre o departamento.
      setSemesterOrDepartment(
        String(
          profileData?.semester ||
            profileData?.department ||
            userData?.semester ||
            userData?.department ||
            ""
        )
      );

      // Llenamos grupo si existe.
      setGroupName(profileData?.group_name || userData?.group_name || "");

      console.log("Usuario para editar:", responseData);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message || "No se pudo cargar el usuario.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando usuario:",
        error.response?.data || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
    useEffect

    Carga la información cuando la pantalla se abre.
  */
  useEffect(() => {
    loadUser();
  }, [id]);

  /*
    buildPayload

    Construye el payload de actualización.

    Base:
    - name
    - email
    - role_id
    - is_active

    Estudiante:
    - enrollment_key
    - career
    - semester
    - group_name

    Tutor/apoyo:
    - employee_key
    - area
    - department
  */
  const buildPayload = () => {
    const payload = {
      name,
      email,
      role_id: Number(roleId),
      is_active: isActive,
    };

    if (Number(roleId) === 4) {
      payload.enrollment_key = institutionalId;
      payload.career = careerOrArea;
      payload.semester = semesterOrDepartment;
      payload.group_name = groupName;
      payload.phone = phone;
    }

    if (Number(roleId) === 2) {
      payload.employee_key = institutionalId;
      payload.area = careerOrArea;
      payload.department = semesterOrDepartment;
      payload.phone = phone;
    }

    if (Number(roleId) === 3) {
      payload.employee_key = institutionalId;
      payload.area = careerOrArea;
      payload.department = semesterOrDepartment;
      payload.phone = phone;
    }

    if (Number(roleId) === 1) {
      payload.area = careerOrArea;
      payload.department = semesterOrDepartment;
      payload.phone = phone;
    }

    return payload;
  };

  /*
    validateForm

    Valida campos antes de enviar al backend.
  */
  const validateForm = () => {
    if (!name.trim()) {
      return "El nombre completo es obligatorio.";
    }

    if (!email.trim()) {
      return "El correo institucional es obligatorio.";
    }

    if ([2, 3, 4].includes(Number(roleId)) && !institutionalId.trim()) {
      return `El campo ${academicLabels.idLabel} es obligatorio.`;
    }

    if (Number(roleId) !== 1 && !careerOrArea.trim()) {
      return `El campo ${academicLabels.firstLabel} es obligatorio.`;
    }

    if (Number(roleId) !== 1 && !semesterOrDepartment.trim()) {
      return `El campo ${academicLabels.secondLabel} es obligatorio.`;
    }

    if (Number(roleId) === 4 && !groupName.trim()) {
      return "El campo Grupo es obligatorio para estudiantes.";
    }

    return "";
  };

  /*
    handleSubmit

    Actualiza el usuario con:
    PUT /api/users/{user}
  */
  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationMessage = validateForm();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSaving(true);

    try {
      const payload = buildPayload();

      console.log("Payload actualizar usuario:", payload);

      const response = await updateUserRequest(id, payload);

      console.log("Usuario actualizado:", response);

      setSuccessMessage("Usuario actualizado correctamente.");

      setTimeout(() => {
        navigate("/admin/users");
      }, 900);
    } catch (error) {
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstErrorKey = Object.keys(validationErrors)[0];
        const firstErrorMessage = validationErrors[firstErrorKey][0];

        setErrorMessage(firstErrorMessage);
      } else {
        const backendMessage =
          error.response?.data?.message || "No se pudo actualizar el usuario.";

        setErrorMessage(backendMessage);
      }

      console.error(
        "Error actualizando usuario:",
        error.response?.data || error.message
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
    handleToggleStatus

    Activa o desactiva la cuenta con:
    PATCH /api/users/{user}/status
  */
  const handleToggleStatus = async () => {
    const nextStatus = !isActive;

    setErrorMessage("");
    setSuccessMessage("");
    setIsChangingStatus(true);

    try {
      const response = await updateUserStatusRequest(id, nextStatus);

      console.log("Estado actualizado:", response);

      setIsActive(nextStatus);

      setSuccessMessage(
        nextStatus
          ? "Cuenta activada correctamente."
          : "Cuenta desactivada correctamente."
      );
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        "No se pudo cambiar el estado del usuario.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cambiando estado:",
        error.response?.data || error.message
      );
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="page-header page-header-with-actions">
        <div>
          <p className="breadcrumb">Usuarios / Editar usuario</p>

          <h2>Editar usuario</h2>

          <p>
            Modifica la información institucional y el estado de acceso del
            usuario.
          </p>
        </div>

        <button
          className="secondary-action-button"
          type="button"
          onClick={() => navigate("/admin/users")}
        >
          <ArrowLeft size={18} />
          Volver a usuarios
        </button>
      </section>

      {isLoading && (
        <section className="panel-card">
          <p>Cargando información del usuario...</p>
        </section>
      )}

      {!isLoading && (
        <form className="create-user-grid" onSubmit={handleSubmit}>
          <section className="panel-card create-user-form">
            <div className="form-section">
              <h3>1. Información del usuario</h3>

              <p>Información básica y estado general del usuario.</p>

              <div className="edit-user-summary">
                <div className="edit-user-avatar">
                  <User size={38} />
                </div>

                <div>
                  <h3>{user?.name || "Usuario MindIA"}</h3>

                  <p>
                    {ROLE_LABELS[roleId] || "Sin rol"} ·{" "}
                    {isActive ? "Cuenta activa" : "Cuenta inactiva"}
                  </p>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>2. Datos de cuenta</h3>

              <div className="form-grid-2">
                <label className="form-field">
                  <span>Correo institucional *</span>

                  <input
                    type="email"
                    placeholder="usuario@universidad.edu.mx"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Rol del usuario *</span>

                  <select
                    value={roleId}
                    onChange={(event) => {
                      setRoleId(Number(event.target.value));
                      setCareerOrArea("");
                      setSemesterOrDepartment("");
                      setGroupName("");
                    }}
                    required
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Nombre completo *</span>

                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Estado de cuenta</span>

                  <select
                    value={isActive ? "active" : "inactive"}
                    onChange={(event) =>
                      setIsActive(event.target.value === "active")
                    }
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>3. Datos personales</h3>

              <div className="form-grid-2">
                <label className="form-field">
                  <span>{academicLabels.idLabel}</span>

                  <input
                    type="text"
                    placeholder="Matrícula o clave institucional"
                    value={institutionalId}
                    onChange={(event) =>
                      setInstitutionalId(event.target.value)
                    }
                    required={[2, 3, 4].includes(Number(roleId))}
                  />
                </label>

                <label className="form-field">
                  <span>Teléfono</span>

                  <input
                    type="text"
                    placeholder="618 000 0000"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3>4. Datos académicos / área</h3>

              <div className="academic-fields-grid">
                <label className="form-field">
                  <span>{academicLabels.firstLabel}</span>

                  <select
                    value={careerOrArea}
                    onChange={(event) => {
                      setCareerOrArea(event.target.value);
                      setSemesterOrDepartment("");
                    }}
                    required={Number(roleId) !== 1}
                  >
                    <option value="">
                      {academicLabels.firstPlaceholder}
                    </option>

                    {Number(roleId) === 4 &&
                      careerOrAreaOptions.map((group) => (
                        <optgroup
                          key={group.groupLabel}
                          label={group.groupLabel}
                        >
                          {group.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}

                    {Number(roleId) !== 4 &&
                      careerOrAreaOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>{academicLabels.secondLabel}</span>

                  <select
                    value={semesterOrDepartment}
                    onChange={(event) =>
                      setSemesterOrDepartment(event.target.value)
                    }
                    required={Number(roleId) !== 1}
                  >
                    <option value="">
                      {academicLabels.secondPlaceholder}
                    </option>

                    {Number(roleId) === 4 &&
                      semesterOrDepartmentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}

                    {Number(roleId) !== 4 &&
                      semesterOrDepartmentOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                  </select>
                </label>

                {Number(roleId) === 4 && (
                  <label className="form-field academic-group-field">
                    <span>Grupo *</span>

                    <select
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                      required
                    >
                      <option value="">Selecciona un grupo</option>

                      {STUDENT_GROUP_OPTIONS.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="form-alert error">{errorMessage}</div>
            )}

            {successMessage && (
              <div className="form-alert success">{successMessage}</div>
            )}

            <div className="form-actions edit-form-actions">
              <button
                className="secondary-action-button"
                type="button"
                onClick={() => navigate("/admin/users")}
              >
                Cancelar
              </button>

              <button
                className="danger-action-button"
                type="button"
                onClick={handleToggleStatus}
                disabled={isChangingStatus}
              >
                <Trash2 size={18} />
                {isChangingStatus
                  ? "Actualizando..."
                  : isActive
                  ? "Desactivar cuenta"
                  : "Activar cuenta"}
              </button>

              <button
                className="primary-action-button"
                type="submit"
                disabled={isSaving}
              >
                <Save size={20} />
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </section>

          <aside className="panel-card permissions-summary">
            <h3>Resumen de cuenta</h3>

            <p>Información rápida sobre el usuario seleccionado.</p>

            <div className="selected-role-card">
              <ShieldCheck size={32} />

              <div>
                <span>Usuario seleccionado</span>
                <strong>{name || "Sin nombre"}</strong>
              </div>
            </div>

            <h4>Actividad de acceso</h4>

            <ul className="permissions-list">
              <li className="allowed">ID del usuario: {id}</li>

              <li className="allowed">
                Rol actual: {ROLE_LABELS[roleId]}
              </li>

              <li className={isActive ? "allowed" : "muted"}>
                Estado: {isActive ? "Activo" : "Inactivo"}
              </li>
            </ul>

            <div className="warning-box">
              Los cambios de rol o estado afectan el acceso del usuario al
              sistema.
            </div>
          </aside>
        </form>
      )}
    </DashboardLayout>
  );
}

export default AdminEditUserPage;