import 'package:flutter/material.dart';
import '../widgets/mindia_logo.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // Controladores: guardan lo que el usuario escribe en los campos de texto.
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool _recordarme = false;
  bool _ocultarPassword = true; // controla el ícono del "ojo"

  @override
  void dispose() {
    // Liberamos los controladores cuando la pantalla se destruye.
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _iniciarSesion() {
    // Aquí, más adelante, harías la petición a tu API (Laravel + Sanctum).
    // Por ahora solo navegamos a la pantalla de privacidad (siguiente paso).
    Navigator.pushReplacementNamed(context, '/privacy');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            children: [
              const SizedBox(height: 20),
              const MindIALogo(),
              const Text(
                'Student Wellness AI',
                style: TextStyle(color: Colors.grey, fontSize: 13),
              ),
              const SizedBox(height: 32),

              // Tarjeta blanca con el formulario
              Container(
                padding: const EdgeInsets.all(20),
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
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const Text(
                      'Bienvenido de nuevo',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Inicia sesión con tu correo institucional\npara continuar.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                    const SizedBox(height: 20),

                    // Campo: correo institucional
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text('Correo institucional',
                          style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        hintText: 'correo@universidad.edu.mx',
                        prefixIcon: const Icon(Icons.mail_outline),
                        filled: true,
                        fillColor: const Color(0xFFF3F6FB),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Campo: contraseña
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text('Contraseña',
                          style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _passwordController,
                      obscureText: _ocultarPassword,
                      decoration: InputDecoration(
                        hintText: '••••••••',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(_ocultarPassword
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined),
                          onPressed: () {
                            setState(() {
                              _ocultarPassword = !_ocultarPassword;
                            });
                          },
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF3F6FB),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Fila: Recuérdame + ¿Olvidaste tu contraseña?
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Checkbox(
                              value: _recordarme,
                              onChanged: (value) {
                                setState(() {
                                  _recordarme = value ?? false;
                                });
                              },
                            ),
                            const Text('Recuérdame', style: TextStyle(fontSize: 13)),
                          ],
                        ),
                        TextButton(
                          onPressed: () {
                            // Aquí iría la lógica de recuperación de contraseña.
                          },
                          child: const Text(
                            '¿Olvidaste tu contraseña?',
                            style: TextStyle(fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Botón principal: Iniciar sesión
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _iniciarSesion,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2151D1),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Iniciar sesión',
                          style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                '¿No tienes una cuenta?',
                style: TextStyle(color: Colors.grey, fontSize: 13),
              ),
              const Text(
                'Contacta a tu tutor o administrador institucional',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
