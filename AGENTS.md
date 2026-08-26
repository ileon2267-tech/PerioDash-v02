# PerioDash v15 Pro - Directrices de Diseño y Desarrollo (Cosmic Slate)

> ### 🎯 GOAL PRIMORDIAL DEL PROYECTO:
> **Experiencia de Usuario Excepcional ("User-Friendly") con Máxima Seguridad en el Tratamiento de Datos PII y PHI.**
> 
> 1. **User-Friendly (Fluidez y Ergonomía Clínica):**
>    - Interfaces intuitivas, limpias y libres de fricción para profesionales de la salud y pacientes.
>    - Registro rápido de sondaje periodontal (a 6 puntos), odontograma interactivo instantáneo, comandos por voz y atajos de teclado (`Ctrl+K`).
>    - Feedback visual claro, microinteracciones fluidas con `motion`, soporte para modo oscuro/claro y plantillas de impresión directa.
> 
> 2. **Protección Rigurosa de PII (Personally Identifiable Information) y PHI (Protected Health Information):**
>    - **Datos Protegidos:** Nombres completos, RUT/DNI, teléfonos, correos electrónicos, direcciones, antecedentes médicos y fichas dentales/radiográficas.
>    - **Enmascaramiento y Cautela Visual:** Ocultar o enmascarar datos sensibles en vistas públicas o compartidas.
>    - **Cero Fuga de Información:** Ningún dato PII debe exponerse en registros de consola del navegador, URLs no autenticadas o mensajes de error detallados.
>    - **Validación Estricta y Cifrado:** Cifrado de extremo a extremo en tránsito (HTTPS / TLS 1.3), 2FA y CAPTCHA en autenticación, y reglas de Firestore que impiden accesos o mutaciones no autorizadas.
>    - **Cumplimiento y Confidencialidad:** Diseñado conforme a estándares internacionales (HIPAA / GDPR / Leyes de Derechos del Paciente).

Estas instrucciones aseguran que la plataforma mantenga su integridad visual, estructural y clínica en futuras integraciones de funciones o al modificar el código.

## 🎨 1. Identidad Visual y Filosofía de Diseño: "Cosmic Slate"
- **Contraste y Gradientes Premium:** En modo oscuro, utilizar difuminados fluidos de fondo (`bg-teal-950/20`) y detalles esmeralda/verde azulado para reducir la fatiga visual. Siempre usar bordes sutiles y fondos de cristal (glassmorphism).
- **Tipografía de Alto Nivel:** Utilizar fuentes geométricas (`Space Grotesk` o `Inter`/`sans`) para encabezados y balancear en gran manera el espacio negativo (paddings amplios, diseño que respire).
- **Micro-animaciones:** La navegación entre pestañas y la barra de búsqueda `Ctrl+K` deben utilizar transiciones fluidas de elevación e ingreso con `motion` (por ejemplo, entradas de escala y opacidad, o deslizamientos en Y). No hacer cambios abruptos. Ninguna animación debe ser exagerada o distractora.

## 🗄️ 2. Estructura de Datos Científica
- Nunca modifiques o simplifiques `types.ts` si no es para ampliar características oficiales.
- PerioDash incluye tipado dental fuerte basado en dentición permanente adulta (32 piezas con notación FDI 11-48).
- **Odontograma:** Cada diente tiene 5 caras formales (`vestibular`, `occlusal/incisal`, `lingual/palatino`, `mesial`, `distal`) y estado general (`sano`, `caries`, `ausente`, `endodoncia`, `implante`).
- **Periodontograma:** Almacenamiento paramétrico a 6 puntos, guardando sondaje, recesión, sangrado y placa bacteriana, además de grado de movilidad y furca.

## 🤖 3. Copiloto Dentito (IA)
- Debe conservar un diseño visual (holograma/avatar creado mediante HTML/CSS crudo) que sea animado, amigable pero muy tecnológico y sin recargar la interfaz.
- Cuenta con API de Voz local: reacciona a comandos de control de la app (ej. "Abre expediente") e incluye protocolos médicos de emergencia.
- Tiene contexto: al momento de pedir sugerencias, se inyecta en el servidor el estado actual de la ficha activa del paciente (JSON de pacientes serializado).

## 💡 Reglas Generales de UX/UI
- **Pantalla Única pero Modular:** La aplicación está centralizada en `App.tsx` organizando paneles mediante el estado de pestañas. No se usan enrutadores como `react-router` a menos que sea estrictamente necesario. Modos minimalistas de pantalla en lugar de múltiples ventanas.
- **Acceso Directo Print (Impresión):** Generación de plantillas optimizadas para PDF siempre que se consulte el odontograma/periodontograma, escondiendo barras laterales `@media print`.

## 🛡️ 4. Principios Fundamentales: "Privacy by Design" y "Security by Design"
Todo cambio, refactorización o nueva característica debe ceñirse estrictamente a los siguientes postulados:
- **Minimización de Datos (Privacy by Design):** Solo recolectar, procesar y transmitir la información médica y personal estrictamente necesaria para el fin clínico. Aplicar anonimización/seudonimización en telemetría y registros de depuración.
- **Privacidad por Defecto:** Las configuraciones de mayor privacidad son el valor predeterminado (sesiones con tiempo de expiración, visibilidad restringida de historiales, consentimiento explícito para compartir fichas).
- **Seguridad en Tránsito y Reposo (Security by Design):** Toda comunicación debe ir cifrada con TLS 1.3 / HTTPS forzado, cabeceras HSTS y Content-Security robustas. Los datos sensibles almacenados en Firestore deben estar protegidos por reglas declarativas estrictas basadas en roles y validación de tipos.
- **Defensa en Profundidad y Mínimo Privilegio (Zero Trust):**
  - Validación en dos capas (Frontend + Backend en `server.ts`).
  - Autenticación multifactor (2FA) y desafíos antirobot (CAPTCHA) en puntos de entrada y flujos críticos.
  - Rate limiting estricto y límites de tamaño de payload para mitigar ataques DDoS, bots e inyecciones.
  - Las llaves secretas (API keys de Gemini y servicios de terceros) deben residir exclusivamente en el backend y nunca ser expuestas al navegador.
