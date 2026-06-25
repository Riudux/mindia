// Importamos useEffect para cargar usuarios al entrar a la pantalla.
// Importamos useMemo para calcular listas filtradas sin recalcular innecesariamente.
// Importamos useState para manejar datos, filtros, errores y carga.
// También importamos useNavigate para movernos a la pantalla de crear usuario.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Importamos iconos visuales para cards, filtros y acciones.
import {
  GraduationCap,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";

// Importamos el layout base del dashboard.
import DashboardLayout from "../../layouts/DashboardLayout";

// Importamos la función que consume GET /api/users.
import { getUsersRequest } from "../../api/adminApi";


/*
  ROLE_LABELS

  Convierte los role_id del backend a nombres visibles.
  Según tu backend:
  1 = admin
  2 = tutor
  3 = support
  4 = student
*/
const ROLE_LABELS = {
  1: "Admin",
  2: "Tutor",
  3: "Apoyo",
  4: "Estudiante",
};

/*
  getUserRole

  Obtiene el rol del usuario aunque el backend lo mande de distintas formas:
  - user.role.name
  - user.role como texto
  - user.role_id como número
*/
const getUserRole = (user) => {
  if (user?.role?.name) {
    return user.role.name;
  }

  if (typeof user?.role === "string") {
    return user.role;
  }

  if (user?.role_id) {
    return ROLE_LABELS[user.role_id] || "Sin rol";
  }

  return "Sin rol";
};

/*
  getUserStatus

  Obtiene el estado del usuario.
  Soporta nombres distintos por si el backend manda:
  - is_active
  - active
  - status
*/
const getUserStatus = (user) => {
  if (typeof user?.is_active === "boolean") {
    return user.is_active ? "Activo" : "Inactivo";
  }

  if (typeof user?.active === "boolean") {
    return user.active ? "Activo" : "Inactivo";
  }

  if (user?.status) {
    return user.status;
  }

  return "Activo";
};

/*
  getUsersArray

  Normaliza la respuesta del backend.

  Esto evita errores si el backend devuelve:
  - un arreglo directo
  - { users: [...] }
  - { data: [...] }
*/
const getUsersArray = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.users)) {
    return responseData.users;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  return [];
};

/*
  getRoleBadgeClass

  Asigna una clase CSS según el rol.
  Esto sirve para pintar badges de colores.
*/
const getRoleBadgeClass = (role) => {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole.includes("admin")) {
    return "badge blue";
  }

  if (normalizedRole.includes("tutor")) {
    return "badge green";
  }

  if (normalizedRole.includes("apoyo") || normalizedRole.includes("support")) {
    return "badge purple";
  }

  if (normalizedRole.includes("estudiante") || normalizedRole.includes("student")) {
    return "badge light-blue";
  }

  return "badge";
};

/*
  getStatusBadgeClass

  Asigna color al estado del usuario.
*/
const getStatusBadgeClass = (status) => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("activo") || normalizedStatus.includes("active")) {
    return "badge green";
  }

  return "badge red";
};

function AdminUsersPage() {
  // Hook para navegar a otras pantallas del panel admin.
  const navigate = useNavigate();
  
  // Estado donde guardamos todos los usuarios del backend.
  const [users, setUsers] = useState([]);

  // Estado para saber si la pantalla está cargando.
  const [isLoading, setIsLoading] = useState(true);

  // Estado para mostrar errores si falla la petición.
  const [errorMessage, setErrorMessage] = useState("");

  // Filtro de texto para buscar por nombre o correo.
  const [searchTerm, setSearchTerm] = useState("");

  // Filtro por rol.
  const [roleFilter, setRoleFilter] = useState("all");

  // Filtro por estado.
  const [statusFilter, setStatusFilter] = useState("all");

  /*
    loadUsers

    Carga los usuarios reales desde el backend Laravel.
    Consume GET /api/users.
  */
  const loadUsers = async () => {
    try {
      // Activamos carga y limpiamos errores.
      setIsLoading(true);
      setErrorMessage("");

      // Consumimos el endpoint de usuarios.
      const responseData = await getUsersRequest();

      // Normalizamos la respuesta para obtener siempre un arreglo.
      const usersArray = getUsersArray(responseData);

      // Guardamos los usuarios en el estado.
      setUsers(usersArray);

      // Dejamos evidencia en consola para revisar estructura.
      console.log("Usuarios cargados:", responseData);
    } catch (error) {
      // Tomamos mensaje del backend si existe.
      const backendMessage =
        error.response?.data?.message || "No se pudo cargar la lista de usuarios.";

      // Guardamos el mensaje para mostrarlo en pantalla.
      setErrorMessage(backendMessage);

      // Mostramos detalle técnico en consola.
      console.error("Error cargando usuarios:", error.response?.data || error.message);
    } finally {
      // Finalizamos la carga.
      setIsLoading(false);
    }
  };

  /*
    useEffect

    Carga los usuarios cuando la pantalla se abre por primera vez.
  */
  useEffect(() => {
    loadUsers();
  }, []);

  /*
    filteredUsers

    Aplica búsqueda, filtro por rol y filtro por estado.
  */
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Convertimos texto de búsqueda a minúsculas.
      const search = searchTerm.toLowerCase();

      // Obtenemos rol y estado del usuario.
      const role = getUserRole(user);
      const status = getUserStatus(user);

      // Validamos si coincide con nombre o correo.
      const matchesSearch =
        user?.name?.toLowerCase().includes(search) ||
        user?.email?.toLowerCase().includes(search);

      // Validamos filtro por rol.
      const matchesRole =
        roleFilter === "all" || role.toLowerCase().includes(roleFilter);

      // Validamos filtro por estado.
      const matchesStatus =
        statusFilter === "all" || status.toLowerCase().includes(statusFilter);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Métricas superiores.
  const totalUsers = users.length;

  const totalStudents = users.filter((user) =>
    getUserRole(user).toLowerCase().includes("estudiante") ||
    getUserRole(user).toLowerCase().includes("student")
  ).length;

  const totalTutors = users.filter((user) =>
    getUserRole(user).toLowerCase().includes("tutor")
  ).length;

  const inactiveUsers = users.filter((user) =>
    getUserStatus(user).toLowerCase().includes("inactivo") ||
    getUserStatus(user).toLowerCase().includes("inactive")
  ).length;

  return (
    <DashboardLayout>
      <section className="page-header page-header-with-actions">
        <div>
          <p className="breadcrumb">Usuarios</p>

          <h2>Gestión de usuarios</h2>

          <p>
            Administra estudiantes, tutores, administradores y personal de apoyo.
          </p>
        </div>

        <button
          className="primary-action-button"
          type="button"
          onClick={() => navigate("/admin/users/create")}
        >
          <UserPlus size={20} />
          Nuevo usuario
        </button>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <div className="metric-icon blue">
            <Users size={30} />
          </div>

          <div>
            <span>Total usuarios</span>
            <h3>{totalUsers}</h3>
            <small>Todos los roles</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon green">
            <GraduationCap size={30} />
          </div>

          <div>
            <span>Estudiantes</span>
            <h3>{totalStudents}</h3>
            <small>Registrados</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon purple">
            <ShieldCheck size={30} />
          </div>

          <div>
            <span>Tutores</span>
            <h3>{totalTutors}</h3>
            <small>Activos</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon orange">
            <UserX size={30} />
          </div>

          <div>
            <span>Cuentas inactivas</span>
            <h3>{inactiveUsers}</h3>
            <small>Sin actividad</small>
          </div>
        </article>
      </section>

      <section className="panel-card filters-panel">
        <h3>Filtros de búsqueda</h3>

        <div className="filters-grid">
          <div className="filter-input">
            <Search size={19} />

            <input
              type="text"
              placeholder="Buscar por nombre o correo"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="all">Rol: Todos</option>
            <option value="admin">Admin</option>
            <option value="tutor">Tutor</option>
            <option value="support">Apoyo</option>
            <option value="estudiante">Estudiante</option>
            <option value="student">Student</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Estado: Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </section>

      <section className="panel-card">
        <div className="table-header">
          <div>
            <h3>Usuarios registrados</h3>
            <p>
              Mostrando {filteredUsers.length} de {totalUsers} usuarios.
            </p>
          </div>
        </div>

        {isLoading && <p>Cargando usuarios...</p>}

        {errorMessage && (
          <p style={{ color: "#ef4444", fontWeight: "700" }}>
            {errorMessage}
          </p>
        )}

        {!isLoading && !errorMessage && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Correo</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const role = getUserRole(user);
                  const status = getUserStatus(user);

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="table-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>

                          <div>
                            <strong>{user.name}</strong>
                            <span>ID: {user.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={getRoleBadgeClass(role)}>
                          {role}
                        </span>
                      </td>

                      <td>
                        <span className={getStatusBadgeClass(status)}>
                          {status}
                        </span>
                      </td>

                      <td>{user.email}</td>

                      <td>
                        <button
                            className="table-action-button"
                            type="button"
                            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                            >
                            Ver / Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      No se encontraron usuarios con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

export default AdminUsersPage;