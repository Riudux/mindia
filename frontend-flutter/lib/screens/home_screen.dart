import 'package:flutter/material.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // Índice de la pestaña seleccionada en la barra inferior.
  int _tabSeleccionada = 0;

  // Pequeño widget reutilizable para las tarjetas de "Accesos rápidos"
  Widget _quickAccessCard({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String titulo,
    required String subtitulo,
  }) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.all(6),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: iconBg,
              child: Icon(icon, size: 16, color: iconColor),
            ),
            const SizedBox(height: 8),
            Text(titulo,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 2),
            Text(subtitulo,
                style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Encabezado: saludo + ícono de perfil
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Hola, Estudiante',
                          style: TextStyle(
                              fontSize: 20, fontWeight: FontWeight.bold)),
                      Text('¿Cómo te sientes hoy?',
                          style: TextStyle(color: Colors.grey, fontSize: 13)),
                    ],
                  ),
                  const CircleAvatar(
                    radius: 20,
                    backgroundColor: Color(0xFFE5E9F2),
                    child: Icon(Icons.person_outline, color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Tarjeta: Chequeo de hoy
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Chequeo de hoy',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 15)),
                        const CircleAvatar(
                          radius: 16,
                          backgroundColor: Color(0xFFE3F7EE),
                          child: Icon(Icons.favorite_border,
                              color: Color(0xFF1F9E73), size: 16),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Aún no has registrado tu estado emocional.',
                      style: TextStyle(color: Colors.grey, fontSize: 12.5),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 42,
                      child: ElevatedButton(
                        onPressed: () {
                          // Aquí navegarías a la pantalla de "Hacer chequeo".
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2151D1),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text('Hacer chequeo',
                            style: TextStyle(
                                color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Sección: Accesos rápidos
              const Text('Accesos rápidos',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 8),
              Row(
                children: [
                  _quickAccessCard(
                    icon: Icons.bolt,
                    iconColor: const Color(0xFF1F9E73),
                    iconBg: const Color(0xFFE3F7EE),
                    titulo: 'Chequeo rápido',
                    subtitulo: 'Registra cómo te sientes.',
                  ),
                  _quickAccessCard(
                    icon: Icons.bar_chart_outlined,
                    iconColor: const Color(0xFF2151D1),
                    iconBg: const Color(0xFFE5ECFB),
                    titulo: 'Historial',
                    subtitulo: 'Consulta tus registros.',
                  ),
                ],
              ),
              Row(
                children: [
                  _quickAccessCard(
                    icon: Icons.calendar_today_outlined,
                    iconColor: const Color(0xFF6B4EE6),
                    iconBg: const Color(0xFFEDE7FB),
                    titulo: 'Mis citas',
                    subtitulo: 'Revisa tus sesiones.',
                  ),
                  _quickAccessCard(
                    icon: Icons.menu_book_outlined,
                    iconColor: const Color(0xFF2151D1),
                    iconBg: const Color(0xFFE5ECFB),
                    titulo: 'Recursos',
                    subtitulo: 'Encuentra apoyo.',
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Tarjeta: Resumen semanal
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Resumen semanal',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 14)),
                        TextButton(
                          onPressed: () {},
                          child: const Text('Ver progreso →',
                              style: TextStyle(fontSize: 12.5)),
                        ),
                      ],
                    ),
                    Row(
                      children: const [
                        Text('Estado promedio: ',
                            style: TextStyle(fontSize: 12.5, color: Colors.grey)),
                        Text('estable',
                            style: TextStyle(
                                fontSize: 12.5,
                                color: Color(0xFF1F9E73),
                                fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 60), // espacio para una futura gráfica
                  ],
                ),
              ),
            ],
          ),
        ),
      ),

      // Barra de navegación inferior con 5 íconos (el del centro resaltado)
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tabSeleccionada,
        onTap: (index) {
          setState(() {
            _tabSeleccionada = index;
          });
        },
        selectedItemColor: const Color(0xFF2151D1),
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Inicio'),
          BottomNavigationBarItem(
              icon: Icon(Icons.show_chart), label: 'Historial'),
          BottomNavigationBarItem(
              icon: Icon(Icons.add_circle, size: 32, color: Color(0xFF2151D1)),
              label: 'Check'),
          BottomNavigationBarItem(
              icon: Icon(Icons.calendar_today_outlined), label: 'Citas'),
          BottomNavigationBarItem(
              icon: Icon(Icons.person_outline), label: 'Perfil'),
        ],
      ),
    );
  }
}
