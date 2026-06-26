// Importamos useState para manejar los datos del formulario.
import { useState } from "react";

// Importamos useNavigate para regresar a la lista de usuarios después de crear.
import { useNavigate } from "react-router-dom";

// Importamos iconos visuales usados en la pantalla.
import {
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";

// Importamos el layout base del dashboard.
import DashboardLayout from "../../layouts/DashboardLayout";

// Importamos los estilos específicos de la página de creación de usuarios.
import "../../styles/pages/admin/AdminUserFormPage.css";

// Importamos la función que consume POST /api/users.
import { createUserRequest } from "../../api/adminApi";

/*
  USER_TYPES

  Define los roles disponibles en la pantalla.

  role_id corresponde a los roles del backend:
  1 = Administrador
  2 = Tutor
  3 = Apoyo psicológico / soporte
  4 = Estudiante
*/
const USER_TYPES = [
  {
    role_id: 4,
    label: "Estudiante",
    icon: GraduationCap,
    description: "Acceso a registro emocional e historial personal.",
  },
  {
    role_id: 2,
    label: "Tutor",
    icon: User,
    description: "Seguimiento de estudiantes asignados.",
  },
  {
    role_id: 1,
    label: "Administrador",
    icon: ShieldCheck,
    description: "Gestión general del sistema.",
  },
  {
    role_id: 3,
    label: "Apoyo psicológico",
    icon: HeartHandshake,
    description: "Atención de canalizaciones institucionales.",
  },
];

/*
  Opciones reales de oferta académica de UNIPOLI Durango.

  BIS se maneja como una variante del programa académico, NO como grupo.
  El grupo académico seguirá siendo A, B, C o D.

  Algunas carreras tienen modalidad BIS. Por eso se agregan dos opciones:
  - Programa normal
  - Programa con modalidad BIS

  Esto permite guardar en el backend:
  career: "TSU - Inteligencia Artificial (BIS)"
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

  Se usan cuando el programa académico NO es modalidad BIS.
  Empiezan en 1 y llegan hasta 10.
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

  Incluye el cuatrimestre 0, usado para inglés intensivo.
  Después continúa con los cuatrimestres normales.
*/
const STUDENT_BIS_QUARTER_OPTIONS = [
  {
    value: "0",
    label: "0 - BIS / Inglés intensivo",
  },
  ...STUDENT_QUARTER_OPTIONS,
];

/*
  Opciones de grupo académico.

  BIS no es grupo.
  Los grupos reales se mantienen como A, B, C y D.
*/
const STUDENT_GROUP_OPTIONS = ["A", "B", "C", "D"];
/*
  Opciones para tutores.

  En tutores, el campo Programa académico se transforma visualmente
  en área académica.
*/
const TUTOR_AREA_OPTIONS = [
  "Tutor académico",
  "Coordinación académica",
  "Orientación educativa",
  "Trabajo social",
  "Psicología",
];

/*
  Opciones para personal de apoyo.

  En apoyo psicológico, el campo se usa como área institucional.
*/
const SUPPORT_AREA_OPTIONS = [
  "Apoyo psicológico",
  "Orientación educativa",
  "Trabajo social",
  "Servicios escolares",
];

/*
  Opciones para administradores.

  En administrador, el campo se usa como área administrativa.
*/
const ADMIN_AREA_OPTIONS = [
  "Administración",
  "Dirección académica",
  "Control escolar",
  "Coordinación institucional",
];

/*
  Opciones generales de departamento.

  Se usan para tutor, apoyo y administrador.
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
  getSelectedRoleInfo

  Busca la información visual del rol seleccionado.
*/
const getSelectedRoleInfo = (roleId) => {
  return USER_TYPES.find((type) => type.role_id === Number(roleId));
};

/*
  isBisProgram

  Detecta si el programa académico seleccionado pertenece a modalidad BIS.

  Se usa para decidir si se muestra el cuatrimestre 0.
*/
const isBisProgram = (careerOrArea) => {
  return careerOrArea.includes("(BIS)");
};

/*
  getCareerOrAreaOptions

  Devuelve opciones para el primer desplegable según el rol.

  Para estudiantes devuelve grupos de programas reales de UNIPOLI.
  Para los demás roles devuelve listas simples de áreas.
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

  Devuelve las opciones del segundo desplegable.

  Para estudiantes:
  - Si el programa es BIS, muestra cuatrimestre 0 al 10.
  - Si no es BIS, muestra cuatrimestre 1 al 10.

  Para otros roles:
  - Devuelve departamentos generales.
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

  Cambia las etiquetas visibles del formulario según el rol seleccionado.
*/
const getAcademicLabels = (roleId) => {
  if (Number(roleId) === 4) {
    return {
      firstLabel: "Programa académico",
      secondLabel: "Cuatrimestre",
      firstPlaceholder: "Selecciona un programa académico",
      secondPlaceholder: "Selecciona un cuatrimestre",
    };
  }

  if (Number(roleId) === 2) {
    return {
      firstLabel: "Área académica",
      secondLabel: "Departamento",
      firstPlaceholder: "Selecciona un área académica",
      secondPlaceholder: "Selecciona un departamento",
    };
  }

  if (Number(roleId) === 3) {
    return {
      firstLabel: "Área de apoyo",
      secondLabel: "Departamento",
      firstPlaceholder: "Selecciona un área de apoyo",
      secondPlaceholder: "Selecciona un departamento",
    };
  }

  return {
    firstLabel: "Área administrativa",
    secondLabel: "Departamento",
    firstPlaceholder: "Selecciona un área administrativa",
    secondPlaceholder: "Selecciona un departamento",
  };
};

function AdminCreateUserPage() {
  // Hook para navegar entre pantallas.
  const navigate = useNavigate();

  // Rol seleccionado. Por defecto usamos estudiante.
  const [roleId, setRoleId] = useState(4);

  // Datos principales de cuenta.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Contraseña temporal para el usuario.
  const [password, setPassword] = useState("");

  // Estado de cuenta.
  const [isActive, setIsActive] = useState(true);

  // Matrícula o ID institucional.
  // Para estudiantes se convierte en enrollment_key.
  // Para tutores o apoyo se convierte en employee_key.
  const [institutionalId, setInstitutionalId] = useState("");

  // Teléfono opcional. Por ahora es visual; el backend puede ignorarlo.
  const [phone, setPhone] = useState("");

  // Programa académico, área académica, área de apoyo o área administrativa.
  const [careerOrArea, setCareerOrArea] = useState("");

  // Cuatrimestre o departamento, según el rol.
  const [semesterOrDepartment, setSemesterOrDepartment] = useState("");
  /*
    Grupo académico del estudiante.

    Este dato se manda al backend como group_name.
    Solo aplica para estudiantes.
    */
  const [groupName, setGroupName] = useState("");

  // Estado para indicar si se está enviando el formulario.
  const [isSaving, setIsSaving] = useState(false);

  // Estado para mostrar errores.
  const [errorMessage, setErrorMessage] = useState("");

  // Estado para mostrar mensaje de éxito.
  const [successMessage, setSuccessMessage] = useState("");

  // Información visual del rol seleccionado.
  const selectedRole = getSelectedRoleInfo(roleId);

  // Opciones visibles del primer desplegable.
  const careerOrAreaOptions = getCareerOrAreaOptions(roleId);

  /*
    Opciones visibles del segundo desplegable.

    Para estudiantes depende también del programa académico,
    porque BIS habilita el cuatrimestre 0.
    */
    const semesterOrDepartmentOptions = getSemesterOrDepartmentOptions(
    roleId,
    careerOrArea
    );

  // Etiquetas dinámicas del formulario.
  const academicLabels = getAcademicLabels(roleId);

  /*
    buildPayload

    Construye el objeto que se enviará al backend.

    Corrección importante del error 422:
    Laravel pedía enrollment_key para estudiantes.
    Antes se estaba enviando institutional_id, por eso fallaba.

    Ahora:
    - Estudiante: enrollment_key
    - Tutor: employee_key
    - Apoyo: employee_key + area
    - Admin: solo datos base
  */
  const buildPayload = () => {
    // Payload base que todos los usuarios necesitan.
    const payload = {
      name,
      email,
      password,
      role_id: Number(roleId),
      is_active: isActive,
    };

    // Si el usuario es estudiante, el backend requiere enrollment_key y group_name.
        if (Number(roleId) === 4) {
        /*
            enrollment_key:
            Matrícula o clave institucional del estudiante.
        */
        payload.enrollment_key = institutionalId;

        /*
            career:
            Programa académico seleccionado.
            Puede incluir modalidad BIS, por ejemplo:
            "TSU - Inteligencia Artificial (BIS)"
        */
        payload.career = careerOrArea;

        /*
            semester:
            Cuatrimestre seleccionado.
            Si el programa es BIS, puede ser 0.
        */
        payload.semester = semesterOrDepartment;

        /*
            group_name:
            Grupo académico del estudiante.
            Solo puede ser A, B, C o D.
        */
        payload.group_name = groupName;
    }

    // Si el usuario es tutor, usamos employee_key.
    if (Number(roleId) === 2) {
      payload.employee_key = institutionalId;
      payload.area = careerOrArea;
      payload.department = semesterOrDepartment;
    }

    // Si el usuario es personal de apoyo, usamos employee_key y area.
    if (Number(roleId) === 3) {
      payload.employee_key = institutionalId;
      payload.area = careerOrArea || "Apoyo psicológico";
      payload.department = semesterOrDepartment;
    }

    // Si el usuario es administrador, agregamos área/departamento como datos opcionales.
    if (Number(roleId) === 1) {
      payload.area = careerOrArea;
      payload.department = semesterOrDepartment;
    }

    return payload;
  };

  /*
    handleSubmit

    Se ejecuta cuando el administrador presiona "Crear usuario".
    Valida el formulario, consume POST /api/users y muestra resultado.
  */
  const handleSubmit = async (event) => {
    // Evitamos que el navegador recargue la página.
    event.preventDefault();

    // Limpiamos mensajes anteriores.
    setErrorMessage("");
    setSuccessMessage("");

    // Activamos estado de guardado.
    setIsSaving(true);

    // Validamos que estudiantes, tutores y apoyo tengan Matrícula / ID.
    if ([2, 3, 4].includes(Number(roleId)) && !institutionalId.trim()) {
      setErrorMessage(
        "El campo Matrícula / ID es obligatorio para este tipo de usuario."
      );
      setIsSaving(false);
      return;
    }

    // Validamos que se haya seleccionado programa o área.
    if (!careerOrArea.trim()) {
      setErrorMessage(`El campo ${academicLabels.firstLabel} es obligatorio.`);
      setIsSaving(false);
      return;
    }

    // Validamos que se haya seleccionado cuatrimestre o departamento.
    if (!semesterOrDepartment.trim()) {
      setErrorMessage(`El campo ${academicLabels.secondLabel} es obligatorio.`);
      setIsSaving(false);
      return;
    }
    // Validamos que el estudiante tenga grupo académico.
    if (Number(roleId) === 4 && !groupName.trim()) {
        setErrorMessage("El campo Grupo es obligatorio para estudiantes.");
        setIsSaving(false);
        return;
    }

    try {
      // Construimos el payload corregido.
      const payload = buildPayload();

      // Mostramos el payload en consola para confirmar qué se envía.
      console.log("Payload crear usuario:", payload);

      // Enviamos los datos al backend.
      const response = await createUserRequest(payload);

      // Mostramos respuesta real del backend.
      console.log("Usuario creado:", response);

      // Mostramos mensaje de éxito.
      setSuccessMessage("Usuario creado correctamente.");

      // Después de crear, regresamos a la lista de usuarios.
      setTimeout(() => {
        navigate("/admin/users");
      }, 900);
    } catch (error) {
      // Si Laravel devuelve errores de validación, mostramos el primero.
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const firstErrorKey = Object.keys(validationErrors)[0];
        const firstErrorMessage = validationErrors[firstErrorKey][0];

        setErrorMessage(firstErrorMessage);
      } else {
        const backendMessage =
          error.response?.data?.message || "No se pudo crear el usuario.";

        setErrorMessage(backendMessage);
      }

      // Mostramos detalle técnico en consola.
      console.error("Error creando usuario:", error.response?.data || error.message);
    } finally {
      // Desactivamos estado de guardado.
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="page-header page-header-with-actions">
        <div>
          <p className="breadcrumb">Usuarios / Crear usuario</p>

          <h2>Crear usuario</h2>

          <p>
            Registra usuarios institucionales y asigna su rol inicial dentro de
            MindIA.
          </p>
        </div>

        <button
          className="secondary-action-button"
          type="button"
          onClick={() => navigate("/admin/users")}
        >
          Volver a usuarios
        </button>
      </section>

      <form className="create-user-grid" onSubmit={handleSubmit}>
        <section className="panel-card create-user-form">
          <div className="form-section">
            <h3>1. Tipo de usuario</h3>
            <p>Selecciona el rol inicial que tendrá la cuenta.</p>

            <div className="role-options">
              {USER_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = Number(roleId) === type.role_id;

                return (
                  <button
                    key={type.role_id}
                    type="button"
                    className={`role-option ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                        /*
                            Cuando cambia el rol, limpiamos datos dependientes
                            para evitar que se queden valores de otro tipo de usuario.
                        */
                        setRoleId(type.role_id);
                        setCareerOrArea("");
                        setSemesterOrDepartment("");
                        setGroupName("");
                    }}
                  >
                    <Icon size={28} />
                    <strong>{type.label}</strong>
                  </button>
                );
              })}
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
                <span>Contraseña temporal *</span>
                <input
                  type="password"
                  placeholder="Ingresa o genera una contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>3. Datos personales</h3>

            <div className="form-grid-2">
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
                <span>Matrícula / ID *</span>
                <input
                  type="text"
                  placeholder="Matrícula o ID institucional"
                  value={institutionalId}
                  onChange={(event) => setInstitutionalId(event.target.value)}
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
            <h3>4. Datos académicos / área</h3>
            <div className="academic-fields-grid">
                <label className="form-field">
                <span>{academicLabels.firstLabel} *</span>

                <select
                    value={careerOrArea}
                    onChange={(event) => {
                    /*
                        Al cambiar el programa académico, limpiamos el cuatrimestre.
                        Esto es importante porque solo BIS permite cuatrimestre 0.
                    */
                    setCareerOrArea(event.target.value);
                    setSemesterOrDepartment("");
                    }}
                    required
                >
                    <option value="">
                    {academicLabels.firstPlaceholder}
                    </option>

                    {/*
                    Para estudiantes mostramos los programas reales de UNIPOLI
                    separados por categoría.
                    */}
                    {Number(roleId) === 4 &&
                    careerOrAreaOptions.map((group) => (
                        <optgroup key={group.groupLabel} label={group.groupLabel}>
                        {group.options.map((option) => (
                            <option key={option.value} value={option.value}>
                            {option.label}
                            </option>
                        ))}
                        </optgroup>
                    ))}

                    {/*
                    Para roles diferentes a estudiante, mostramos áreas simples.
                    */}
                    {Number(roleId) !== 4 &&
                    careerOrAreaOptions.map((option) => (
                        <option key={option} value={option}>
                        {option}
                        </option>
                    ))}
                </select>
                </label>

                <label className="form-field">
                <span>{academicLabels.secondLabel} *</span>

                <select
                    value={semesterOrDepartment}
                    onChange={(event) => setSemesterOrDepartment(event.target.value)}
                    required
                >
                    <option value="">
                    {academicLabels.secondPlaceholder}
                    </option>

                    {/*
                    Para estudiantes mostramos cuatrimestres.
                    Si el programa elegido es BIS, aparecerá también el cuatrimestre 0.
                    */}
                    {Number(roleId) === 4 &&
                    semesterOrDepartmentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                        {option.label}
                        </option>
                    ))}

                    {/*
                    Para otros roles mostramos departamentos.
                    */}
                    {Number(roleId) !== 4 &&
                    semesterOrDepartmentOptions.map((option) => (
                        <option key={option} value={option}>
                        {option}
                        </option>
                    ))}
                </select>
                </label>

                {/*
                Campo Grupo.

                Solo aparece para estudiantes.
                BIS no aparece aquí porque BIS pertenece al programa académico,
                no al grupo.
                */}
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

          {errorMessage && <div className="form-alert error">{errorMessage}</div>}

          {successMessage && (
            <div className="form-alert success">{successMessage}</div>
          )}

          <div className="form-actions">
            <button
              className="secondary-action-button"
              type="button"
              onClick={() => navigate("/admin/users")}
            >
              Cancelar
            </button>

            <button
              className="primary-action-button"
              type="submit"
              disabled={isSaving}
            >
              <UserPlus size={20} />
              {isSaving ? "Creando usuario..." : "Crear usuario"}
            </button>
          </div>
        </section>

        <aside className="panel-card permissions-summary">
          <h3>Resumen de permisos</h3>

          <p>Los permisos se asignan según el rol seleccionado.</p>

          <div className="selected-role-card">
            {selectedRole && <selectedRole.icon size={32} />}

            <div>
              <span>Rol seleccionado</span>
              <strong>{selectedRole?.label}</strong>
            </div>
          </div>

          <h4>Permisos principales</h4>

          <ul className="permissions-list">
            <li className={Number(roleId) === 4 ? "allowed" : "muted"}>
              Acceso a la app móvil
            </li>

            <li className={Number(roleId) === 4 ? "allowed" : "muted"}>
              Registro emocional diario
            </li>

            <li
              className={
                Number(roleId) === 2 || Number(roleId) === 1
                  ? "allowed"
                  : "muted"
              }
            >
              Acceso al dashboard web
            </li>

            <li className={Number(roleId) === 1 ? "allowed" : "muted"}>
              Gestión de usuarios
            </li>

            <li className={Number(roleId) === 3 ? "allowed" : "muted"}>
              Atención de canalizaciones
            </li>
          </ul>

          <div className="warning-box">
            Los datos emocionales solo estarán disponibles para usuarios
            autorizados según su rol.
          </div>
        </aside>
      </form>
    </DashboardLayout>
  );
}

export default AdminCreateUserPage;