// Importamos el cliente API configurado.
// Este ya incluye baseURL, headers y token automático.
import apiClient from "./apiClient";

// Función para iniciar sesión.
// Recibe las credenciales del usuario: email y password.
export const loginRequest = async (credentials) => {
  // Mandamos una petición POST al endpoint /login del backend.
  const response = await apiClient.post("/login", credentials);

  // Regresamos solamente la data de la respuesta.
  return response.data;
};

// Función para consultar el usuario autenticado.
// Sirve para validar que el token guardado sigue funcionando.
export const meRequest = async () => {
  // Mandamos una petición GET al endpoint /me.
  const response = await apiClient.get("/me");

  // Regresamos la información del usuario autenticado.
  return response.data;
};

// Función para cerrar sesión.
// El backend invalida el token actual.
export const logoutRequest = async () => {
  // Mandamos una petición POST al endpoint /logout.
  const response = await apiClient.post("/logout");

  // Regresamos la respuesta del backend.
  return response.data;
};
