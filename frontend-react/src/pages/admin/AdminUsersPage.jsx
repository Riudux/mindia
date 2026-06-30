import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Search,
  ShieldCheck,
  UserPlus,
  UserRoundX,
  UsersRound,
} from "lucide-react";

import { getUsersRequest } from "../../api/adminApi";

import "../../styles/pages/admin/AdminUsersPage.css";

/*
  Pantalla de gestión de usuarios.

  Esta vista permite al administrador consultar usuarios registrados,
  filtrarlos por nombre/correo, rol y estado, además de navegar hacia
  la creación o edición de usuarios.
*/
const AdminUsersPage = () => {
  /*
    Hook de navegación para movernos entre pantallas administrativas.
  */
  const navigate = useNavigate();

  /*
    Lista de usuarios cargados desde el backend.
  */
  const [users, setUsers] = useState([]);

  /*
    Estados de filtros.
  */
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  /*
    Estados visuales de carga y error.
  */
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /*
    Extrae la lista de usuarios desde diferentes estructuras posibles
    del backend.
  */
  const extractUsers = (response) => {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.users)) {
      return response.users;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    return [];
  };

  /*
    Obtiene el rol real del usuario de forma normalizada.

    Soporta respuestas como:
    - user.role.name
    - user.role
    - user.role_name
    - user.role_id

    Retorna:
    - admin
    - student
    - tutor
    - support
  */
  const getUserRole = (user) => {
    const roleFromObject = user?.role?.name;
    const roleFromText = user?.role_name || user?.role;

    const normalizedRole = String(roleFromObject || roleFromText || "")
      .trim()
      .toLowerCase();

    if (normalizedRole === "admin" || normalizedRole === "administrator") {
      return "admin";
    }

    if (normalizedRole === "student" || normalizedRole === "estudiante") {
      return "student";
    }

    if (normalizedRole === "tutor") {
      return "tutor";
    }

    if (
      normalizedRole === "support" ||
      normalizedRole === "support_staff" ||
      normalizedRole === "apoyo"
    ) {
      return "support";
    }

    /*
      Mapeo por ID de rol según la base actual de MindIA:
      1 = admin
      2 = tutor
      3 = support
      4 = student
    */
    const roleId = Number(user?.role_id);

    if (roleId === 1) {
      return "admin";
    }

    if (roleId === 2) {
      return "tutor";
    }

    if (roleId === 3) {
      return "support";
    }

    if (roleId === 4) {
      return "student";
    }

    return "unknown";
  };

  /*
    Traduce el rol normalizado a una etiqueta visible en español.
  */
  const getUserRoleLabel = (user) => {
    const role = getUserRole(user);

    if (role === "admin") {
      return "Admin";
    }

    if (role === "student") {
      return "Estudiante";
    }

    if (role === "tutor") {
      return "Tutor";
    }

    if (role === "support") {
      return "Apoyo";
    }

    return "Sin rol";
  };

  /*
    Devuelve la clase visual del badge de rol.
  */
  const getUserRoleBadgeClass = (user) => {
    const role = getUserRole(user);

    if (role === "admin") {
      return "badge blue";
    }

    if (role === "student") {
      return "badge light-blue";
    }

    if (role === "tutor") {
      return "badge green";
    }

    if (role === "support") {
      return "badge purple";
    }

    return "badge";
  };

  /*
    Obtiene el estado real del usuario.

    Se prioriza is_active porque es booleano.
    Después se revisa status porque viene como texto desde el backend.
  */
  const getUserStatus = (user) => {
    if (
      user?.is_active === false ||
      user?.is_active === 0 ||
      user?.is_active === "0" ||
      user?.is_active === "false"
    ) {
      return "inactive";
    }

    const status = String(user?.status || "").trim().toLowerCase();

    if (status === "inactive" || status === "disabled") {
      return "inactive";
    }

    return "active";
  };

  /*
    Traduce el estado a español.
  */
  const getUserStatusLabel = (user) => {
    return getUserStatus(user) === "active" ? "Activo" : "Inactivo";
  };

  /*
    Devuelve la clase visual del estado.
  */
  const getUserStatusBadgeClass = (user) => {
    return getUserStatus(user) === "active" ? "badge green" : "badge red";
  };

  /*
    Obtiene la primera letra del nombre para mostrarla en el avatar.
  */
  const getUserInitial = (user) => {
    return String(user?.name || "U").charAt(0).toUpperCase();
  };

  /*
    Carga los usuarios desde el backend.
  */
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getUsersRequest();
      const usersList = extractUsers(response);

      setUsers(usersList);
    } catch (error) {
      const backendMessage =
        error.response?.data?.message || "No se pudieron cargar los usuarios.";

      setErrorMessage(backendMessage);

      console.error(
        "Error cargando usuarios:",
        error.response?.data || error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
    Carga inicial de usuarios.
  */
  useEffect(() => {
    loadUsers();
  }, []);

  /*
    Usuarios con rol estudiante.
  */
  const studentUsers = useMemo(() => {
    return users.filter((user) => getUserRole(user) === "student");
  }, [users]);

  /*
    Usuarios con rol tutor.
  */
  const tutorUsers = useMemo(() => {
    return users.filter((user) => getUserRole(user) === "tutor");
  }, [users]);

  /*
    Usuarios con rol support/apoyo.
  */
  const supportUsers = useMemo(() => {
    return users.filter((user) => getUserRole(user) === "support");
  }, [users]);

  /*
    Usuarios inactivos.
  */
  const inactiveUsers = useMemo(() => {
    return users.filter((user) => getUserStatus(user) === "inactive");
  }, [users]);

  /*
    Aplica filtros por búsqueda, rol y estado.
  */
  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const role = getUserRole(user);
      const status = getUserStatus(user);

      const searchableText = [
        user?.name,
        user?.email,
        getUserRoleLabel(user),
        getUserStatusLabel(user),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      const matchesRole = roleFilter === "all" || role === roleFilter;

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  /*
    Estado de carga inicial.
  */
  if (isLoading) {
    return (
      <section>
        <div className="page-header">
          <p className="breadcrumb">Usuarios</p>
          <h2>Gestión de usuarios</h2>
          <p>Cargando usuarios registrados...</p>
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
          <p className="breadcrumb">Usuarios</p>
          <h2>Gestión de usuarios</h2>
          <p>Administra estudiantes, tutores, administradores y personal de apoyo.</p>
        </div>

        <button
          type="button"
          className="primary-action-button"
          onClick={() => navigate("/admin/users/create")}
        >
          <UserPlus size={18} />
          Nuevo usuario
        </button>
      </div>

      {errorMessage && <div className="form-alert error">{errorMessage}</div>}

      <div className="metrics-grid">
        <article className="metric-card">
          <div className="metric-icon blue">
            <UsersRound size={28} />
          </div>

          <div>
            <span>Total usuarios</span>
            <h3>{users.length}</h3>
            <small>Todos los roles</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon green">
            <GraduationCap size={28} />
          </div>

          <div>
            <span>Estudiantes</span>
            <h3>{studentUsers.length}</h3>
            <small>Registrados</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon purple">
            <ShieldCheck size={28} />
          </div>

          <div>
            <span>Tutores</span>
            <h3>{tutorUsers.length}</h3>
            <small>Activos</small>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-icon orange">
            <UserRoundX size={28} />
          </div>

          <div>
            <span>Cuentas inactivas</span>
            <h3>{inactiveUsers.length}</h3>
            <small>Sin actividad</small>
          </div>
        </article>
      </div>

      <div className="panel-card users-filters-card">
        <h3>Filtros de búsqueda</h3>

        <div className="users-filters-grid">
          <div className="filter-input">
            <Search size={18} />

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
            <option value="student">Estudiante</option>
            <option value="tutor">Tutor</option>
            <option value="support">Apoyo</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Estado: Todos</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="panel-card users-table-card">
        <div className="table-header">
          <div>
            <h3>Usuarios registrados</h3>
            <p>
              Mostrando {filteredUsers.length} de {users.length} usuarios.
            </p>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-summary">
            No hay usuarios que coincidan con los filtros seleccionados.
          </div>
        ) : (
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
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="table-avatar">
                          {getUserInitial(user)}
                        </div>

                        <div>
                          <strong>{user.name}</strong>
                          <span>ID: {user.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={getUserRoleBadgeClass(user)}>
                        {getUserRoleLabel(user)}
                      </span>
                    </td>

                    <td>
                      <span className={getUserStatusBadgeClass(user)}>
                        {getUserStatusLabel(user)}
                      </span>
                    </td>

                    <td>{user.email}</td>

                    <td>
                      <button
                        type="button"
                        className="table-action-button"
                        onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                      >
                        Ver / Editar
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

export default AdminUsersPage;
