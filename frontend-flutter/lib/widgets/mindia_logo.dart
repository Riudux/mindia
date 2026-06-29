import 'package:flutter/material.dart';

class MindIALogo extends StatelessWidget {
  final double size;
  const MindIALogo({super.key, this.size = 70});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Aquí insertamos tu imagen local
        Image.asset(
          'assets/logo.png',
          height: size, 
          width: size,
          // fit: BoxFit.contain, // Descomenta esto si tu imagen se recorta o deforma
        ),
        const SizedBox(height: 8),
        Text(
          'MindIA',
          style: TextStyle(
            fontSize: size * 0.34,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1A2B5C),
          ),
        ),
      ],
    );
  }
}