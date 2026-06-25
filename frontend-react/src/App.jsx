// Importamos el sistema principal de rutas de la aplicación.
import AppRouter from "./routes/AppRouter";

function App() {
  // App solamente carga las rutas principales.
  // Las pantallas reales estarán dentro de src/pages.
  return <AppRouter />;
}

export default App;