// Importamos hooks de React Router para navegar y saber en qué ruta estamos.
import { useLocation, useNavigate } from "react-router-dom";

// Importamos iconos de lucide-react para construir el menú visual.
import {
  Bell,
  Calendar,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  HeartHandshake,
  Home,
  LogOut,
  Search,
  Settings,
  Shield,
  User,
  UserPlus,
  Users,
} from "lucide-react";

// Importamos los estilos del layout.
import "../styles/DashboardLayout.css";
import "../styles/shared/Buttons.css";
import "../styles/shared/Cards.css";
import "../styles/shared/Forms.css";
import "../styles/shared/Tables.css";

/*
  Configuración visual por rol.

  Esta información permite cambiar automáticamente:
  - El subtítulo del panel.
  - El texto del buscador.
  - El nombre mostrado en la parte inferior del sidebar.
*/
const ROLE_CONFIG = {
  admin: {
    panelName: "Admin Panel",
    profileRole: "Administrador",
    searchPlaceholder: "Buscar estudiante, tutor o alerta...",
  },
  tutor: {
    panelName: "Tutor Panel",
    profileRole: "Tutor académico",
    searchPlaceholder: "Buscar estudiante, alerta o seguimiento...",
  },
  support: {
    panelName: "Área de apoyo",
    profileRole: "Área de apoyo",
    searchPlaceholder: "Buscar estudiante, matrícula o caso...",
  },
  student: {
    panelName: "Student Panel",
    profileRole: "Estudiante",
    searchPlaceholder: "Buscar historial, registro o apoyo...",
  },
};

/*
  Menú lateral por rol.

  ready indica si la ruta ya existe.
  Por ahora dejamos varias opciones bloqueadas visualmente porque todavía no
  hemos creado todas las pantallas internas.
*/
const NAV_ITEMS = {
  admin: [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: Home,
      ready: true,
    },
    {
      label: "Usuarios",
      path: "/admin/users",
      icon: Users,
      ready: true,
    },
    {
      label: "Estudiantes",
      path: "/admin/students",
      icon: GraduationCap,
      ready: false,
    },
    {
      label: "Asignaciones",
      path: "/admin/assignments",
      icon: ClipboardList,
      ready: true,
    },
    {
      label: "Alertas",
      path: "/admin/alerts",
      icon: Bell,
      ready: false,
    },
    {
      label: "Casos canalizados",
      path: "/admin/referrals",
      icon: HeartHandshake,
      ready: false,
    },
    {
      label: "Reportes",
      path: "/admin/reports",
      icon: FileText,
      ready: false,
    },
    {
      label: "Configuración",
      path: "/admin/settings",
      icon: Settings,
      ready: false,
    },
  ],
  tutor: [
    {
      label: "Dashboard",
      path: "/tutor/dashboard",
      icon: Home,
      ready: true,
    },
    {
      label: "Mis estudiantes",
      path: "/tutor/students",
      icon: Users,
      ready: true,
    },
    {
      label: "Alertas",
      path: "/tutor/alerts",
      icon: Bell,
      ready: true,
    },
    {
      label: "Seguimiento",
      path: "/tutor/followups",
      icon: ClipboardList,
      ready: false,
    },
    {
      label: "Canalizaciones",
      path: "/tutor/referrals",
      icon: HeartHandshake,
      ready: false,
    },
    {
      label: "Citas",
      path: "/tutor/appointments",
      icon: Calendar,
      ready: false,
    },
    {
      label: "Perfil",
      path: "/tutor/profile",
      icon: User,
      ready: false,
    },
  ],
  support: [
    {
      label: "Dashboard",
      path: "/support/dashboard",
      icon: Home,
      ready: true,
    },
    {
      label: "Casos canalizados",
      path: "/support/referrals",
      icon: ClipboardList,
      ready: true,
    },
    {
      label: "Estudiantes en seguimiento",
      path: "/support/students",
      icon: Users,
      ready: true,
    },
    {
      label: "Citas",
      path: "/support/appointments",
      icon: Calendar,
      ready: false,
    },
    {
      label: "Reportes",
      path: "/support/reports",
      icon: FileText,
      ready: false,
    },
    {
      label: "Perfil",
      path: "/support/profile",
      icon: User,
      ready: false,
    },
  ],
  student: [
    {
      label: "Dashboard",
      path: "/student/dashboard",
      icon: Home,
      ready: true,
    },
    {
      label: "Registro emocional",
      path: "/student/emotional-records",
      icon: ClipboardList,
      ready: false,
    },
    {
      label: "Historial",
      path: "/student/history",
      icon: FileText,
      ready: false,
    },
    {
      label: "Apoyo institucional",
      path: "/student/support",
      icon: Shield,
      ready: false,
    },
    {
      label: "Perfil",
      path: "/student/profile",
      icon: User,
      ready: false,
    },
  ],
};

/*
  Función auxiliar para leer de forma segura el usuario guardado.

  Si localStorage tiene datos corruptos, evita que la aplicación se rompa.
*/
const getStoredUser = () => {
  try {
    const userStored = localStorage.getItem("mindia_user");
    return userStored ? JSON.parse(userStored) : null;
  } catch {
    return null;
  }
};

/*
  Función auxiliar para obtener iniciales del usuario.
  Ejemplo: "Admin MindIA" => "AM"
*/
const getInitials = (name) => {
  if (!name) {
    return "MI";
  }

  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

function DashboardLayout({ children }) {
  // Hook para conocer la ruta actual.
  const location = useLocation();

  // Hook para navegar a otra ruta.
  const navigate = useNavigate();

  // Obtenemos el usuario guardado después del login.
  const user = getStoredUser();

  // Obtenemos el rol guardado después del login.
  const role = localStorage.getItem("mindia_role") || "student";

  // Obtenemos la configuración visual del rol actual.
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  // Obtenemos los elementos del menú según el rol actual.
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.student;

  // Función para cerrar sesión localmente.
  const handleLogout = () => {
    // Eliminamos datos de sesión.
    localStorage.removeItem("mindia_token");
    localStorage.removeItem("mindia_user");
    localStorage.removeItem("mindia_role");

    // Regresamos al login.
    navigate("/login");
  };

  // Función para navegar desde el menú lateral.
  const handleNavigate = (item) => {
    // Si la pantalla todavía no está lista, no navegamos.
    if (!item.ready) {
      return;
    }

    // Si la pantalla ya existe, navegamos normalmente.
    navigate(item.path);
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <GraduationCap size={30} />
          </div>

          <div>
            <h1>MindIA</h1>
            <p>{roleConfig.panelName}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            // Guardamos el icono del item para renderizarlo como componente.
            const Icon = item.icon;

            // Validamos si la ruta actual coincide con el item.
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.label}
                type="button"
                className={`sidebar-link ${isActive ? "active" : ""} ${
                  !item.ready ? "disabled" : ""
                }`}
                onClick={() => handleNavigate(item)}
              >
                <Icon size={21} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            {getInitials(user?.name)}
          </div>

          <div className="profile-info">
            <strong>{user?.name || "Usuario MindIA"}</strong>
            <span>{roleConfig.profileRole}</span>
            <small>● En línea</small>
          </div>

          <ChevronDown size={18} />
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="topbar">
          <div className="topbar-search">
            <Search size={20} />
            <input
              type="text"
              placeholder={roleConfig.searchPlaceholder}
            />
          </div>

          <div className="topbar-actions">
            <button className="notification-button" type="button">
              <Bell size={22} />
              <span>3</span>
            </button>

            <div className="topbar-user">
              <div className="topbar-avatar">
                {getInitials(user?.name)}
              </div>

              <div>
                <strong>{user?.name || "Usuario MindIA"}</strong>
                <span>{roleConfig.profileRole}</span>
              </div>

              <ChevronDown size={18} />
            </div>

            <button
              className="logout-button"
              type="button"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          {children}
        </main>
      </section>
    </div>
  );
}

export default DashboardLayout;