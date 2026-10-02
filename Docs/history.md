# Historial — QualityTrack

Registro append-only, lo más nuevo arriba. Una entrada por ciclo de cambio cerrado.

## 2026-10-02 · Datos personales y baja lógica de usuarios
Type:     add
Change:   Administrador puede editar nombre, apellido, email y DNI, y desactivar o reactivar cuentas con confirmación. DNI obligatorio y único en las altas y el administrador inicial; cuentas existentes con DNI pendiente para completar al editar. Filtros Activos/Inactivos/Todos y datos conservados al dar de baja.
Reason:   corregir datos de las personas y retirar el acceso cuando dejan de trabajar, manteniendo la cuenta vinculada a su historial.
Impact:   baja y revocación de todas las sesiones en una transacción; cuentas inactivas no pueden entrar ni renovar/acceder con tokens previos. Reactivar requiere nuevo login. Protección del propio estado y último Administrador activo, incluso con cambios de rol/estado concurrentes. Migración aditiva para dni/is_active y snapshot actualizado; ADMIN_DNI manual para el primer seed, sin cambios de secretos.

Recuperación y cambio de contraseña siguen fuera de alcance.

## 2026-10-02 · Administración de usuarios y roles
Type:     add
Change:   Administrador puede listar cuentas y roles existentes, crear usuarios y cambiar sus roles desde Usuarios. Los demás roles no acceden a estas acciones, por interfaz ni por API. Email normalizado y único; contraseñas con bcrypt, sin hashes en respuestas y con el límite de 72 bytes UTF-8 compartido con login y seed.
Reason:   incorporar cuentas de los cinco roles para operar el flujo con identidades reales, además del administrador inicial.
Impact:   cambios de rol efectivos en la siguiente petición de sesiones vigentes; protección contra autodegradación y pérdida de administradores, incluidos cambios simultáneos. Sin migraciones ni nuevas dependencias.

El editor de permisos, borrado/deshabilitación de cuentas y recuperación/cambio de contraseña siguen fuera de alcance.

## 2026-09-22 · Autenticación — F-001
Type:     add
Change:   cada persona entra con su cuenta y la aplicación sabe quién es y qué rol tiene mientras la usa. Inicio de sesión con correo y contraseña, opción "Recordarme", renovación de la sesión sin volver a pedir la contraseña, cierre de sesión y recuperación de la sesión vigente al reabrir la aplicación.
Reason:   el PRD pide trazabilidad de quién intervino en cada etapa (RF-18); sin identidad no hay nada que registrar.
Impact:   RN-acceso-con-credenciales, RN-credenciales-invalidas, RN-sesion-requerida, RN-sesion-renovable, RN-sesion-sin-recordarme, RN-sesion-con-recordarme, RN-sesion-por-inactividad, RN-sesiones-simultaneas, RN-cierre-de-sesion, RN-sesion-copiada y RN-sin-registro-publico nuevas · US-001 a US-004 quedan indexadas en la spec y sin escribir, por decisión del usuario (Q-12) · roles del negocio y un usuario administrador inicial pasan a existir como datos iniciales (Q-08)
Decision: la credencial viaja y se guarda en el navegador, sin cookies; la objeción por XSS quedó registrada y el usuario la mantuvo (QT-04). Sin "Recordarme" la sesión vale solo en esa pestaña (QT-25)
Decision: usar una sesión ya renovada cierra todas las sesiones de esa persona en todos sus dispositivos (RN-sesion-copiada, diseño QT-21)

Fuera de alcance y sin confirmar por el usuario: bloqueo por intentos fallidos, usuarios deshabilitados, y recuperación y cambio de contraseña (Q-09, Q-10, Q-11). No hay permisos por rol sobre las operaciones: cualquier persona con sesión vigente puede usar todo lo que exista.
