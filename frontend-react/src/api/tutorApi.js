import apiClient from "./apiClient";

/*
  Obtiene los estudiantes asignados al tutor autenticado.

  Laravel identifica al tutor usando el token de sesión, por eso no se manda
  tutor_id desde React.
*/
export const getTutorStudentsRequest = async () => {
  const response = await apiClient.get("/tutor/students");
  return response.data;
};

/*
  Obtiene las alertas visibles para el tutor autenticado.
*/
export const getTutorAlertsRequest = async () => {
  const response = await apiClient.get("/tutor/alerts");
  return response.data;
};

/*
  Obtiene los registros emocionales de un estudiante asignado al tutor.

  El parámetro studentId corresponde al ID real de la tabla students,
  no al ID de la tabla users.
*/
export const getTutorStudentEmotionalRecordsRequest = async (studentId) => {
  const response = await apiClient.get(
    `/tutor/students/${studentId}/emotional-records`
  );

  return response.data;
};

/*
  Obtiene las tendencias emocionales de un estudiante.

  Estas tendencias son indicadores institucionales de seguimiento,
  no diagnósticos clínicos.
*/
export const getTutorStudentEmotionalTrendsRequest = async (studentId) => {
  const response = await apiClient.get(
    `/tutor/students/${studentId}/emotional-trends`
  );

  return response.data;
};

/*
  Obtiene el resumen de riesgo institucional de un estudiante.

  El sistema debe interpretar esta información como apoyo para seguimiento,
  no como diagnóstico.
*/
export const getTutorStudentRiskSummaryRequest = async (studentId) => {
  const response = await apiClient.get(
    `/tutor/students/${studentId}/risk-summary`
  );

  return response.data;
};

/*
  Genera una alerta institucional para un estudiante.

  El backend se encarga de analizar los registros y crear la alerta
  correspondiente según su lógica.
*/
export const generateTutorStudentAlertRequest = async (studentId) => {
  const response = await apiClient.post(
    `/tutor/students/${studentId}/alerts/generate`
  );

  return response.data;
};

/*
  Marca una alerta como revisada por el tutor.

  El backend registra que la alerta ya fue atendida/revisada.
*/
export const reviewTutorAlertRequest = async (alertId) => {
  const response = await apiClient.patch(`/tutor/alerts/${alertId}/review`);
  return response.data;
};

/*
  Canaliza una alerta al área de apoyo institucional.

  El alertId corresponde al ID de la alerta.
  El payload puede incluir:
  - priority: prioridad del caso.
  - reason: motivo de canalización.
  - notes: observaciones del tutor.
*/
export const createTutorReferralRequest = async (alertId, payload) => {
  const response = await apiClient.post(
    `/tutor/alerts/${alertId}/referrals`,
    payload
  );

  return response.data;
};

/*
  Obtiene el personal de apoyo disponible para canalizaciones.

  Esta lista se usa en la pantalla de Canalizar a apoyo para que el tutor
  seleccione dinámicamente a qué persona enviar el caso.
*/
export const getTutorSupportStaffRequest = async () => {
  const response = await apiClient.get("/tutor/support-staff");
  return response.data;
};
