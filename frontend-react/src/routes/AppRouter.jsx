// Importamos herramientas principales de React Router.
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Importamos el componente que protege rutas privadas por rol.
import ProtectedRoute from "./ProtectedRoute";

// Importamos páginas públicas.
import LoginPage from "../pages/LoginPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

// Importamos página que redirige según el rol.
import DashboardRedirect from "../pages/DashboardRedirect";

// Importamos dashboards por rol.
import DashboardLayout from "../layouts/DashboardLayout";

// Importamos dashboards temporales por rol.
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import TutorDashboardPage from "../pages/tutor/TutorDashboardPage";
import SupportDashboardPage from "../pages/support/SupportDashboardPage";
import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminCreateUserPage from "../pages/admin/AdminCreateUserPage";
import AdminEditUserPage from "../pages/admin/AdminEditUserPage";
import AdminAssignmentsPage from "../pages/admin/AdminAssignmentsPage";
import TutorStudentsPage from "../pages/tutor/TutorStudentsPage";
import TutorStudentDetailPage from "../pages/tutor/TutorStudentDetailPage";
import TutorAlertsPage from "../pages/tutor/TutorAlertsPage";
import TutorAlertDetailPage from "../pages/tutor/TutorAlertDetailPage";
import TutorReferralPage from "../pages/tutor/TutorReferralPage";
import SupportReferralsPage from "../pages/support/SupportReferralsPage";
import SupportReferralDetailPage from "../pages/support/SupportReferralDetailPage";
import SupportReferralAttentionPage from "../pages/support/SupportReferralAttentionPage";
import SupportStudentsPage from "../pages/support/SupportStudentsPage";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta inicial.
            Redirige automáticamente al login. */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Ruta pública de inicio de sesión. */}
        <Route path="/login" element={<LoginPage />} />

        {/* Ruta intermedia.
            Después del login, detecta el rol y manda al dashboard correcto. */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Ruta para accesos no autorizados. */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Ruta protegida del administrador.
            Solo usuarios con rol admin pueden entrar. */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
            path="/admin/users"
            element={
                <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsersPage />
                </ProtectedRoute>
            }
        />

        {/* Ruta protegida del estudiante.
            Solo usuarios con rol student pueden entrar. */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
            path="/admin/users/create"
            element={
                <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminCreateUserPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/admin/users/:id/edit"
            element={
                <ProtectedRoute allowedRoles={["admin"]}>
                <AdminEditUserPage />
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


        {/* Ruta protegida del tutor.
            Solo usuarios con rol tutor pueden entrar. */}
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

        {/* Ruta protegida del personal de soporte.
            Solo usuarios con rol support pueden entrar. */}
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

        {/* Ruta comodín.
            Si el usuario entra a una URL que no existe, se manda al login. */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;