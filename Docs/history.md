# Historial — QualityTrack

Registro append-only, lo más nuevo arriba. Una entrada por ciclo de cambio cerrado.

## 2026-09-22 · Autenticación — F-001
Type:     add
Change:   cada persona entra con su cuenta y la aplicación sabe quién es y qué rol tiene mientras la usa. Inicio de sesión con correo y contraseña, opción "Recordarme", renovación de la sesión sin volver a pedir la contraseña, cierre de sesión y recuperación de la sesión vigente al reabrir la aplicación.
Reason:   el PRD pide trazabilidad de quién intervino en cada etapa (RF-18); sin identidad no hay nada que registrar.
Impact:   RN-acceso-con-credenciales, RN-credenciales-invalidas, RN-sesion-requerida, RN-sesion-renovable, RN-sesion-sin-recordarme, RN-sesion-con-recordarme, RN-sesion-por-inactividad, RN-sesiones-simultaneas, RN-cierre-de-sesion, RN-sesion-copiada y RN-sin-registro-publico nuevas · US-001 a US-004 quedan indexadas en la spec y sin escribir, por decisión del usuario (Q-12) · roles del negocio y un usuario administrador inicial pasan a existir como datos iniciales (Q-08)
Decision: la credencial viaja y se guarda en el navegador, sin cookies; la objeción por XSS quedó registrada y el usuario la mantuvo (QT-04). Sin "Recordarme" la sesión vale solo en esa pestaña (QT-25)
Decision: usar una sesión ya renovada cierra todas las sesiones de esa persona en todos sus dispositivos (RN-sesion-copiada, diseño QT-21)

Fuera de alcance y sin confirmar por el usuario: bloqueo por intentos fallidos, usuarios deshabilitados, y recuperación y cambio de contraseña (Q-09, Q-10, Q-11). No hay permisos por rol sobre las operaciones: cualquier persona con sesión vigente puede usar todo lo que exista.
