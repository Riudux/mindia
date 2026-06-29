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