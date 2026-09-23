# F-001 · Autenticación

## Qué resuelve
Quality Track guarda la trazabilidad de los trabajos y el PRD pide poder identificar quién intervino en cada etapa (RF-18). Para eso, cada persona tiene que entrar con su propia cuenta y el sistema tiene que saber quién es y qué rol tiene mientras usa la aplicación, sin pedirle la contraseña a cada rato.

## Alcance

**Dentro**
- Iniciar sesión con correo y contraseña, con la opción "Recordarme".
- Mantener la sesión abierta mientras la persona usa la aplicación, renovándola sin volver a pedir la contraseña.
- Saber quién es la persona con sesión abierta: nombre, apellido, correo y rol.
- Cerrar sesión.
- Recuperar la sesión al volver a abrir la aplicación, si sigue vigente.
- Un usuario administrador inicial y los roles del negocio, para poder entrar (Q-08).

**Fuera**
- Dashboard y demás módulos: el usuario pidió únicamente el inicio de sesión (Q-03).
- Registro público y alta de usuarios: va con la gestión de usuarios (Q-08).
- Permisos por rol en las operaciones: todavía no hay operaciones que proteger (Q-03).
- Bloqueo por intentos fallidos, usuarios deshabilitados, recuperación y cambio de contraseña: propuestos por el agente para una ronda posterior, sin confirmar (Q-09, Q-10, Q-11).

## Reglas de negocio

### RN-acceso-con-credenciales · origin: Q-02
Solo entra a la aplicación quien escribe un correo registrado y su contraseña correcta.

### RN-credenciales-invalidas · origin: Q-07
Si el correo no está registrado o la contraseña no corresponde, entonces no se inicia sesión y se muestra siempre el mismo mensaje: "Correo electrónico o contraseña incorrectos.", sin indicar cuál de los dos falló.

### RN-sesion-requerida · origin: Q-01
Quien no tiene una sesión vigente no puede ver ni usar ninguna parte de la aplicación, salvo la pantalla de inicio de sesión.

### RN-sesion-renovable · origin: Q-02
Mientras la sesión está vigente, se renueva sola con el uso, sin volver a pedir la contraseña.

### RN-sesion-sin-recordarme · origin: Q-04, Q-14
Si la persona inicia sesión sin "Recordarme", la sesión vale solo en esa pestaña: termina al cerrarla y, como máximo, 12 horas después de iniciarla. Abrir la aplicación en otra pestaña pide iniciar sesión de nuevo.

### RN-sesion-con-recordarme · origin: Q-04
Si la persona inicia sesión con "Recordarme", la sesión sigue vigente mientras no pasen 7 días desde su último uso, aunque cierre el navegador.

### RN-sesion-por-inactividad · origin: Q-04
Si pasan 7 días sin usar la aplicación, entonces la sesión vence y hay que volver a iniciar sesión.

### RN-sesiones-simultaneas · origin: Q-05
Una persona puede tener sesiones abiertas en varios dispositivos a la vez, y cada una es independiente de las demás.

### RN-cierre-de-sesion · origin: Q-02, Q-05
Cuando la persona cierra sesión, esa sesión deja de servir, aunque alguien la haya copiado antes; sus sesiones en otros dispositivos siguen abiertas.

### RN-sesion-copiada · origin: Q-06
Si se detecta que se usa una sesión que ya había sido renovada, entonces se cierran todas las sesiones de esa persona en todos sus dispositivos y tiene que volver a iniciar sesión.

### RN-sin-registro-publico · origin: Q-08
No existe registro público: solo pueden entrar las personas cuya cuenta ya existe en el sistema.

## Requisitos no funcionales
- La contraseña nunca se guarda ni se muestra tal como se escribió. (propuesto por el agente, sin confirmar)

## Historias
| Historia | Qué cubre |
|---|---|
| US-001-iniciar-sesion | Entrar con credenciales válidas, con y sin "Recordarme", y el rechazo de las inválidas |
| US-002-mantener-sesion | Renovación de la sesión mientras se usa, vencimiento y sesión copiada |
| US-003-cerrar-sesion | Cerrar sesión en un dispositivo sin afectar a los demás |
| US-004-recuperar-sesion | Volver a abrir la aplicación y seguir dentro si la sesión está vigente |

Las historias no se escriben en esta ronda: el usuario hace los tests (Q-12) y el plan no las incluye.

## Abierto
- Q-09, Q-10, Q-11 · Propuestos por el agente y nunca confirmados: quedan fuera de F-001, que se cerró el 2026-09-22 sin ellos (ver `Docs/history.md`). Si el usuario los pide, entran con su propia feature.
