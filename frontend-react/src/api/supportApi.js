import apiClient from "./apiClient";

/*
  Obtiene los casos canalizados al personal de apoyo autenticado.

  Laravel identifica al usuario de apoyo mediante el token.
  Por eso React no necesita mandar support_staff_id.
*/
export const getSupportReferralsRequest = async () => {
  const response = await apiClient.get("/support/referrals");
  return response.data;
};

/*
  Actualiza el estado de una canalización.

  Este endpoint se usará más adelante para marcar casos como:
  - pending
  - in_progress
  - closed
*/
export const updateSupportReferralStatusRequest = async (referralId, payload) => {
  const response = await apiClient.patch(
    `/support/referrals/${referralId}/status`,
    payload
  );

  return response.data;
};

/*
  Obtiene las atenciones registradas para un caso canalizado.

  El referralId corresponde al ID de la canalización.
*/
export const getSupportReferralFollowupsRequest = async (referralId) => {
  const response = await apiClient.get(
    `/support/referrals/${referralId}/followups`
  );

  return response.data;
};

/*
  Registra una nueva atención institucional para un caso canalizado.

  El payload puede incluir:
  - attention_type
  - notes
  - result
  - close_case
*/
export const createSupportReferralFollowupRequest = async (
  referralId,
  payload
) => {
  const response = await apiClient.post(
    `/support/referrals/${referralId}/followups`,
    payload
  );

  return response.data;
};