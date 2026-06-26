// Importamos el cliente API central.
// Este cliente ya tiene configurada la URL base, headers y token Bearer automático.
import apiClient from "./apiClient";

/*
  getAdminDashboardSummary

  Consume:
  GET /api/admin/dashboard-summary

  Sirve para obtener las métricas principales del dashboard administrativo.
*/
export const getAdminDashboardSummary = async () => {
  // Hacemos la petición GET al endpoint del dashboard admin.
  const response = await apiClient.get("/admin/dashboard-summary");

  // Regresamos solo los datos útiles de la respuesta.
  return response.data;
};

/*
  getUsersRequest

  Consume:
  GET /api/users

  Sirve para obtener la lista de usuarios registrados en MindIA.
*/
export const getUsersRequest = async () => {
  // Hacemos la petición GET al endpoint de usuarios.
  const response = await apiClient.get("/users");

  // Regresamos solo la data de la respuesta.
  return response.data;
};

/*
  getUserRequest

  Consume:
  GET /api/users/{user}

  Sirve para consultar la información de un usuario específico antes de editarlo.
*/
export const getUserRequest = async (userId) => {
  // Pedimos al backend los datos del usuario seleccionado.
  const response = await apiClient.get(`/users/${userId}`);

  // Regresamos la respuesta del backend.
  return response.data;
};

/*
  createUserRequest

  Consume:
  POST /api/users

  Sirve para crear un nuevo usuario desde el panel administrador.
*/
export const createUserRequest = async (payload) => {
  // Enviamos los datos del nuevo usuario al backend.
  const response = await apiClient.post("/users", payload);

  // Regresamos la respuesta del backend.
  return response.data;
};

/*
  updateUserRequest

  Consume:
  PUT /api/users/{user}

  Sirve para modificar información general del usuario:
  - nombre
  - correo
  - rol
  - estado activo/inactivo
*/
export const updateUserRequest = async (userId, payload) => {
  // Enviamos los datos actualizados al backend.
  const response = await apiClient.put(`/users/${userId}`, payload);

  // Regresamos la respuesta del backend.
  return response.data;
};

/*
  updateUserStatusRequest

  Consume:
  PATCH /api/users/{user}/status

  Sirve para activar o desactivar una cuenta.

  Importante:
  El backend Laravel está validando el campo "status",
  no el campo "is_active".

  Por eso convertimos el booleano del frontend:
  true  -> "active"
  false -> "inactive"
*/
export const updateUserStatusRequest = async (userId, isActive) => {
  // Convertimos el estado booleano del frontend al texto que espera Laravel.
  const statusValue = isActive ? "active" : "inactive";

  // Enviamos el nuevo estado al endpoint de cambio de estado.
  const response = await apiClient.patch(`/users/${userId}/status`, {
    status: statusValue,
  });

  // Regresamos la respuesta del backend.
  return response.data;
};

/*
  Obtiene las asignaciones estudiante-tutor registradas en el sistema.

  Este endpoint se usa en la pantalla de Asignaciones para mostrar
  qué estudiantes ya tienen un tutor asignado.
*/
export const getStudentTutorAssignmentsRequest = async () => {
  const response = await apiClient.get("/student-tutor-assignments");
  return response.data;
};

/*
  Crea una nueva asignación entre un estudiante y un tutor.

  El backend espera recibir:
  - student_id: ID real del perfil de estudiante.
  - tutor_id: ID real del perfil de tutor.
*/
export const createStudentTutorAssignmentRequest = async (payload) => {
  const response = await apiClient.post("/student-tutor-assignments", payload);
  return response.data;
};