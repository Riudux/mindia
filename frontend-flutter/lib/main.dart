import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/privacy_screen.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const MindIAApp());
}

class MindIAApp extends StatelessWidget {
  const MindIAApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MindIA',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFEFF3FA),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2151D1),
        ),
        fontFamily: 'Roboto',
      ),
      // Aquí definimos las pantallas como "rutas" con nombre.
      // Así puedes navegar entre ellas con Navigator.pushNamed(context, '/home');
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/privacy': (context) => const PrivacyScreen(),
        '/home': (context) => const HomeScreen(),
      },
    );
  }
}
