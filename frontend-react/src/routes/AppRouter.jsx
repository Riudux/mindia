// Importamos herramientas principales de React Router.
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Importamos el componente que protege rutas privadas por rol.
import ProtectedRoute from "./ProtectedRoute";

// Importamos páginas públicas.
import LoginPage from "../pages/LoginPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

// Importamos página que redirige según el rol autenticado.
import DashboardRedirect from "../pages/DashboardRedirect";

// Importamos el layout general del panel web.
import DashboardLayout from "../layouts/DashboardLayout";

// Importamos pantallas administrativas.
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminCreateUserPage from "../pages/admin/AdminCreateUserPage";
import AdminEditUserPage from "../pages/admin/AdminEditUserPage";
import AdminAssignmentsPage from "../pages/admin/AdminAssignmentsPage";

// Importamos pantallas de tutor.
import TutorDashboardPage from "../pages/tutor/TutorDashboardPage";
import TutorStudentsPage from "../pages/tutor/TutorStudentsPage";
import TutorStudentDetailPage from "../pages/tutor/TutorStudentDetailPage";
import TutorAlertsPage from "../pages/tutor/TutorAlertsPage";
import TutorAlertDetailPage from "../pages/tutor/TutorAlertDetailPage";
import TutorReferralPage from "../pages/tutor/TutorReferralPage";

// Importamos pantallas del área de apoyo.
import SupportDashboardPage from "../pages/support/SupportDashboardPage";
import SupportReferralsPage from "../pages/support/SupportReferralsPage";
import SupportReferralDetailPage from "../pages/support/SupportReferralDetailPage";
import SupportReferralAttentionPage from "../pages/support/SupportReferralAttentionPage";
import SupportStudentsPage from "../pages/support/SupportStudentsPage";

/*
  AppRouter

  Define las rutas del panel web de MindIA.

  Nota importante:
  El rol estudiante no tiene panel web en este MVP. Su flujo pertenece a la
  aplicación móvil en Flutter, por eso no existe dashboard web de estudiante.
*/
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta inicial. */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas públicas. */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Bloquea cualquier intento de entrar a rutas web de estudiante. */}
        <Route path="/student/*" element={<Navigate to="/unauthorized" replace />} />

        {/* Admin. */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout>
                <AdminDashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout>
                <AdminUsersPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users/create"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout>
                <AdminCreateUserPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout>
                <AdminEditUserPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/assignments"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout>
                <AdminAssignmentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Tutor. */}
        <Route
          path="/tutor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["tutor"]}>
              <DashboardLayout>
                <TutorDashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tutor/students"
          element={
            <ProtectedRoute allowedRoles={["tutor"]}>
              <DashboardLayout>
                <TutorStudentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tutor/students/:id"
          element={
            <ProtectedRoute allowedRoles={["tutor"]}>
              <DashboardLayout>
                <TutorStudentDetailPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tutor/alerts"
          element={
            <ProtectedRoute allowedRoles={["tutor"]}>
              <DashboardLayout>
                <TutorAlertsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tutor/alerts/:id"
          element={
            <ProtectedRoute allowedRoles={["tutor"]}>
              <DashboardLayout>
                <TutorAlertDetailPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tutor/alerts/:id/referral"
          element={
            <ProtectedRoute allowedRoles={["tutor"]}>
              <DashboardLayout>
                <TutorReferralPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Área de apoyo. */}
        <Route
          path="/support/dashboard"
          element={
            <ProtectedRoute allowedRoles={["support", "support_staff"]}>
              <DashboardLayout>
                <SupportDashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/support/referrals"
          element={
            <ProtectedRoute allowedRoles={["support", "support_staff"]}>
              <DashboardLayout>
                <SupportReferralsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/support/referrals/:id"
          element={
            <ProtectedRoute allowedRoles={["support", "support_staff"]}>
              <DashboardLayout>
                <SupportReferralDetailPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/support/referrals/:id/attention"
          element={
            <ProtectedRoute allowedRoles={["support", "support_staff"]}>
              <DashboardLayout>
                <SupportReferralAttentionPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/support/students"
          element={
            <ProtectedRoute allowedRoles={["support", "support_staff"]}>
              <DashboardLayout>
                <SupportStudentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Ruta comodín. */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
