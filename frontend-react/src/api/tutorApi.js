import apiClient from "./apiClient";

/*
  Obtiene la lista de estudiantes asignados al tutor autenticado.

  El backend identifica al tutor mediante el token de sesión,
  por lo tanto no es necesario mandar tutor_id desde React.
*/
export const getTutorStudentsRequest = async () => {
  const response = await apiClient.get("/tutor/students");
  return response.data;
};

/*
  Obtiene las alertas visibles para el tutor autenticado.

  Estas alertas sirven para mostrar pendientes de revisión
  dentro del dashboard del tutor.
*/
export const getTutorAlertsRequest = async () => {
  const response = await apiClient.get("/tutor/alerts");
  return response.data;
};