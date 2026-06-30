// Importamos Axios, que nos permite hacer peticiones HTTP al backend.
import axios from "axios";

// Creamos una instancia personalizada de Axios.
// Esta instancia tendrá la URL base del backend y los headers principales.
const apiClient = axios.create({
  // VITE_API_URL viene del archivo .env
  // Ejemplo: http://127.0.0.1:8000/api
  baseURL: import.meta.env.VITE_API_URL,

  // Headers que se mandarán por defecto en cada petición.
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Interceptor de REQUEST.
// Este código se ejecuta antes de mandar cualquier petición al backend.
apiClient.interceptors.request.use(
  (config) => {
    // Obtenemos el token guardado en localStorage.
    const token = localStorage.getItem("mindia_token");

    // Si existe token, lo agregamos al header Authorization.
    // Laravel Sanctum espera el formato: Bearer TOKEN
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Retornamos la configuración modificada para que la petición continúe.
    return config;
  },
  (error) => {
    // Si ocurre un error antes de enviar la petición, lo rechazamos.
    return Promise.reject(error);
  }
);

// Interceptor de RESPONSE.
// Este código se ejecuta después de recibir una respuesta del backend.
apiClient.interceptors.response.use(
  // Si la respuesta fue exitosa, simplemente la regresamos.
  (response) => response,

  // Si la respuesta trae error, lo manejamos aquí.
  (error) => {
    // Si el backend responde 401, significa que el usuario no está autenticado
    // o que el token ya no es válido.
    if (error.response?.status === 401) {
      // Eliminamos los datos de sesión guardados localmente.
      localStorage.removeItem("mindia_token");
      localStorage.removeItem("mindia_user");
      localStorage.removeItem("mindia_role");
    }

    // Regresamos el error para que cada pantalla pueda mostrar su propio mensaje.
    return Promise.reject(error);
  }
);

// Exportamos apiClient para usarlo en otros archivos del frontend.
export default apiClient;
