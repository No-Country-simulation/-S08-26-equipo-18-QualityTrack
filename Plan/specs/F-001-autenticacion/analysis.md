# F-001 · Autenticación — análisis

Registro append-only. Una respuesta reemplazada se marca (`reemplazada por Q-NN`); nunca se borra.
Fuentes: conversación con el usuario (2026-09-22) y el documento funcional de Quality Track (PRD).

## Respuestas

### Q-01 · ¿Qué se construye en esta ronda?
**Respuesta (usuario, 2026-09-22):** únicamente el inicio de sesión con sus políticas de sesión y refresco; primero el backend y después el frontend integrado para que quede consistente.

### Q-02 · ¿Cómo se mantiene la sesión?
**Respuesta (usuario, 2026-09-22):** JWT en cookies, con política de refresco de la sesión. *(transporte reemplazado por Q-13; la política de refresco sigue)*

### Q-03 · ¿Entran el dashboard y el resto de módulos?
**Respuesta (usuario, 2026-09-22):** no; "únicamente los endpoints de login". El resto queda para rondas posteriores.

## Ronda 1 (respondida)

### Q-04 · ¿Cuánto dura una sesión y qué cambia "Recordarme"?
Caso: Laura inicia sesión el lunes a las 8:00 en la PC de la oficina y cierra el navegador a las 18:00. El martes a las 8:00 abre la aplicación.
**Propuesta:** sin "Recordarme", la sesión termina al cerrar el navegador y como máximo a las 12 h; con "Recordarme", Laura sigue dentro durante 7 días desde su último uso. En ambos casos, pasados 7 días sin uso, tiene que volver a iniciar sesión.
**Respuesta (usuario, 2026-09-22):** se aprueba la propuesta.

### Q-05 · ¿Puede una persona tener sesiones abiertas en varios dispositivos?
Caso: Martín (Calidad) usa la PC de su escritorio y una tablet en planta al mismo tiempo. Cierra sesión en la tablet.
**Propuesta:** sí, las sesiones son independientes; cerrar sesión en la tablet no cierra la de la PC.
**Respuesta (usuario, 2026-09-22):** se aprueba la propuesta.

### Q-06 · ¿Qué pasa si se detecta que una sesión fue copiada o robada?
Caso: alguien copia la sesión de Martín y la usa después de que Martín ya la renovó.
**Propuesta:** se cierran todas las sesiones de Martín en todos sus dispositivos y tiene que volver a iniciar sesión.
**Respuesta (usuario, 2026-09-22):** se aprueba la propuesta.

### Q-07 · ¿Qué ve quien escribe mal el correo o la contraseña?
Caso: alguien escribe `ana@empresa.com` (no existe) y otra persona escribe bien el correo pero mal la contraseña.
**Propuesta:** ambos ven el mismo mensaje, "Correo electrónico o contraseña incorrectos.", para no revelar qué correos están registrados (el frontend ya usa ese texto).
**Respuesta (usuario, 2026-09-22):** se aprueba la propuesta.

### Q-08 · ¿Cómo existen los primeros usuarios?
**Propuesta:** no hay registro público. En esta ronda se crea un usuario administrador inicial y los roles del negocio (Administrador, Supervisor, Producción, Calidad, Administración, tomados del frontend); el alta de usuarios queda para la funcionalidad de gestión de usuarios.
**Respuesta (usuario, 2026-09-22):** se aprueba la propuesta.

## Preguntas para una ronda posterior (propuestas fuera de alcance)
- **Q-09 · ¿Se bloquea el acceso tras varios intentos fallidos?** Propuesta: fuera de esta ronda.
- **Q-10 · ¿Existen usuarios deshabilitados que no pueden entrar?** Hoy no existe ese concepto en los datos. Propuesta: fuera de esta ronda, va con gestión de usuarios.
- **Q-11 · ¿Se puede recuperar o cambiar la contraseña?** Propuesta: fuera de esta ronda.

## Notas técnicas (las resuelve arquitectura, sin identificador)
- Si el token viaja solo en cookies no legibles desde JS o también en el cuerpo de la respuesta: el agente propuso solo cookies y el usuario pidió adaptar el frontend "para que quede consistente". Confirmar en el diseño técnico.
- Duración del token de acceso frente a la del refresco, flags de las cookies, dominio cruzado frontend (Netlify) ↔ backend (Render).

## Q-12 · ¿Quién escribe y corre los tests?
**Respuesta (usuario, 2026-09-22):** todos los tests los hace el usuario. El agente solo verifica que la aplicación compile; el usuario avisa si hay algo que corregir.

## Q-13 · ¿Dónde guarda el navegador la sesión?
**Respuesta (usuario, 2026-09-22):** JWT guardado en `localStorage`, sin cookies. Reemplaza el "en cookies" de Q-02.
Objeción del agente, registrada: un script inyectado puede leer `localStorage` y robar la sesión; propuso cookies servidas desde el mismo dominio mediante un proxy en Netlify. El usuario mantiene `localStorage`.

## Q-14 · Sin "Recordarme", ¿la sesión termina al cerrar el navegador o a las 12 h? (surge de Q-13, contradice Q-04)
**Propuesta:** a las 12 h desde el login, aunque se cierre el navegador. La alternativa (que termine al cerrar la pestaña) obliga a iniciar sesión en cada pestaña nueva.
**Respuesta (usuario, 2026-09-22):** sin "Recordarme", la sesión vive solo en esa pestaña y termina al cerrarla; con "Recordarme", persiste en el navegador. El agente advirtió que abrir la app en otra pestaña pide login de nuevo; el usuario lo acepta. Sobre la objeción de Q-13: "es para un MVP".
