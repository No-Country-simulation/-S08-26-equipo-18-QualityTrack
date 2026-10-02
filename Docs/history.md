# Historial — QualityTrack

Registro append-only, lo más nuevo arriba. Una entrada por ciclo de cambio cerrado.

## 2026-10-02 · Numeración automática de solicitudes y cotizaciones
Type:     fix
Change:   solicitudes y cotizaciones reciben números SOL/COT generados por el servidor mediante secuencias independientes. Los formularios indican que el número se asignará al guardar y muestran el número existente sin permitir edición.
Reason:   evitar pedir al usuario identificadores manuales y garantizar números distintos en altas simultáneas.
Impact:   DTOs de alta sin número del navegador, UNIQUE existente conservado y migración de secuencias que continúa desde correlativos históricos compatibles. Ningún registro previo se renumera; sus IDs y relaciones se conservan. Las secuencias pueden tener saltos por operaciones fallidas.

## 2026-10-02 · Origen y aprobación interna de órdenes de trabajo
Type:     add
Change:   API y formulario de OT desde cotización aceptada, con cliente y solicitud derivados; numeración única de servidor y origen consultable desde el detalle. Administrador y Supervisor gestionan OT y su aprobación interna; Producción y Calidad consultan.
Reason:   convertir el origen comercial aceptado en un trabajo persistido sin números calculados por el navegador ni relaciones inventadas.
Impact:   secuencia PostgreSQL y UNIQUE, alta de OT/aprobación pendiente atómica, dictamen con actor y fecha reales y actualización transaccional del estado. Edición conserva identidad/origen, valida fechas y no elude aprobación. Sin borrado físico ni reapertura de OT cerradas. Migración conserva los datos históricos sin completar origen ficticio y se detiene ante números o aprobaciones duplicados para revisión explícita.

Operaciones, materiales y personal corresponden a la siguiente etapa. Sin cambios de secretos ni nuevas dependencias.

## 2026-10-02 · Solicitudes, cotizaciones y decisión comercial
Type:     add
Change:   APIs autenticadas de solicitudes y cotizaciones con ítems, formularios conectados y consulta del detalle. Administrador, Supervisor y Administración pueden gestionar el origen comercial; Producción consulta solicitudes. Administrador y Supervisor registran aceptación o rechazo con confirmación.
Reason:   persistir el origen comercial del trabajo y registrar la decisión del cliente antes de incorporar el alta de OT.
Impact:   cliente activo en altas, solicitud del mismo cliente, números únicos e inmutables, cantidades y precios decimales validados. Importes calculados por el servidor con redondeo a centavos e impuesto actual del 21 %, cotización e ítems en una transacción, autor y fechas del servidor. Decisión persistida e idempotente; cotizaciones decididas y solicitudes ya cotizadas conservan su contenido. Sin borrado físico. Migración aditiva y snapshot actualizado; las ofertas anteriores quedan pendientes y conservan sus datos, sin aceptación inventada.

La aceptación comercial no equivale a aprobación interna de OT. El alta de OT y sus restricciones corresponden a la siguiente etapa. Sin cambios de secretos ni nuevas dependencias.

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
