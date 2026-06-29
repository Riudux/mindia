import 'package:flutter/material.dart';
import '../widgets/mindia_logo.dart';

class PrivacyScreen extends StatefulWidget {
  const PrivacyScreen({super.key});

  @override
  State<PrivacyScreen> createState() => _PrivacyScreenState();
}

class _PrivacyScreenState extends State<PrivacyScreen> {
  bool _aceptoDatos = false;

  void _continuar() {
    if (!_aceptoDatos) {
      // Si no aceptó, mostramos un aviso simple (Snackbar) y no avanzamos.
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Debes aceptar el uso de tus datos para continuar.'),
        ),
      );
      return;
    }
    Navigator.pushReplacementNamed(context, '/home');
  }

  // Pequeño widget interno para no repetir código en cada una de las 4 filas
  // de información (Datos protegido, No es diagnóstico, etc.)
  Widget _infoRow({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String titulo,
    required String descripcion,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: iconBg,
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  titulo,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: iconColor,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  descripcion,
                  style: const TextStyle(fontSize: 12.5, color: Colors.black87),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
          child: Column(
            children: [
              const MindIALogo(size: 60),
              const SizedBox(height: 4),
              const Text(
                'Tu bienestar importa',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              const Text(
                'Antes de continuar, conoce cómo MindIA\nusará tu información emocional',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 13),
              ),
              const SizedBox(height: 20),

              // Tarjeta blanca con las 4 explicaciones
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _infoRow(
                      icon: Icons.verified_user_outlined,
                      iconColor: const Color(0xFF1F9E73),
                      iconBg: const Color(0xFFE3F7EE),
                      titulo: 'Datos protegido',
                      descripcion:
                          'Tu información será utilizada solo para seguimiento emocional institucional.',
                    ),
                    const Divider(height: 1),
                    _infoRow(
                      icon: Icons.favorite_outline,
                      iconColor: const Color(0xFF2151D1),
                      iconBg: const Color(0xFFE5ECFB),
                      titulo: 'No es diagnóstico',
                      descripcion:
                          'MindIA no reemplaza una evaluación psicológica profesional.',
                    ),
                    const Divider(height: 1),
                    _infoRow(
                      icon: Icons.groups_outlined,
                      iconColor: const Color(0xFF6B4EE6),
                      iconBg: const Color(0xFFEDE7FB),
                      titulo: 'Apoyo institucional',
                      descripcion:
                          'Los tutores y el área de apoyo podrán dar seguimiento cuando sea necesario.',
                    ),
                    const Divider(height: 1),
                    _infoRow(
                      icon: Icons.psychology_outlined,
                      iconColor: const Color(0xFF6B4EE6),
                      iconBg: const Color(0xFFEDE7FB),
                      titulo: 'Uso responsable de IA',
                      descripcion:
                          'La IA solo identifica posibles señales de riesgo para apoyar el seguimiento.',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Checkbox de aceptación
              Row(
                children: [
                  Checkbox(
                    value: _aceptoDatos,
                    onChanged: (value) {
                      setState(() {
                        _aceptoDatos = value ?? false;
                      });
                    },
                  ),
                  const Expanded(
                    child: Text(
                      'Acepto el uso de mis datos para seguimiento emocional institucional.',
                      style: TextStyle(fontSize: 12.5),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Botón principal: Aceptar y continuar
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _continuar,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2151D1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Aceptar y continuar',
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 15),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () {
                  // Aquí podrías navegar a una pantalla con el aviso de privacidad completo.
                },
                child: const Text('Ver aviso de privacidad completo'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
