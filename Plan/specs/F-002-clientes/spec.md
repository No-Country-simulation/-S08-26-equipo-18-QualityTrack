# F-002 · Clientes

## Qué resuelve
Todo el trabajo que Quality Track registra — solicitudes, cotizaciones, órdenes de trabajo, entregas — es para alguien. Sin una ficha de cliente cargada y confiable no hay a quién asociar ese trabajo, y la trazabilidad que pide el PRD queda colgando. Esta feature es el alta y el mantenimiento de esa ficha.

## Alcance

**Dentro**
- Dar de alta un cliente con sus datos de identificación y contacto.
- Modificar los datos de un cliente existente.
- Desactivar un cliente que ya no opera, y volver a activarlo (Q-02).
- Ver la lista de clientes de a páginas y buscar uno por razón social o CUIT (Q-04).
- Ver la ficha completa de un cliente.

**Fuera**
- Eliminar clientes definitivamente: el usuario decidió que no se borran, se desactivan (Q-02).
- Permisos por rol sobre clientes: cualquier persona con sesión vigente puede administrarlos, igual que en F-001. Entra cuando se definan los permisos del producto.
- Solicitudes, cotizaciones y órdenes de trabajo del cliente: son sus propias features.
- Importar clientes desde una planilla: nadie lo pidió.
- Contactos múltiples por cliente: la ficha tiene un solo contacto.

## Reglas de negocio

### RN-cuit-identifica-al-cliente · origin: Q-01
Cada cliente se identifica por su CUIT: once dígitos numéricos.

### RN-cuit-irrepetible · origin: Q-01
Si ya existe un cliente con ese CUIT, entonces el alta no se guarda y se avisa que ese CUIT ya está registrado.

### RN-cuit-invalido · origin: Q-01
Si el CUIT no tiene once dígitos, o su dígito verificador no corresponde al número, entonces no se guarda y se avisa que el CUIT no es válido.

### RN-datos-minimos-del-cliente · origin: Q-03
Un cliente no puede guardarse sin razón social, CUIT, correo electrónico y teléfono.

### RN-correo-de-contacto-valido · origin: Q-03
Si el correo electrónico no tiene forma de dirección de correo, entonces el cliente no se guarda y se avisa cuál es el dato mal cargado.

### RN-datos-complementarios-opcionales · origin: Q-03
El nombre de contacto, la dirección, la ciudad, la provincia y las notas pueden quedar vacíos, y se completan más adelante sin volver a pedir el resto de la ficha.

### RN-clientes-no-se-eliminan · origin: Q-02
Los clientes nunca se borran del sistema.

### RN-cliente-desactivado-no-se-ofrece · origin: Q-02
Mientras un cliente está desactivado, no aparece en la lista de clientes ni puede elegirse para un trabajo nuevo.

### RN-historial-del-cliente-desactivado · origin: Q-02
El trabajo ya registrado de un cliente desactivado se conserva y sigue mostrando a qué cliente pertenece.

### RN-cliente-reactivable · origin: Q-02
Un cliente desactivado puede volver a activarse, y vuelve a estar disponible con los mismos datos que tenía.

### RN-listado-por-paginas · origin: Q-04
La lista de clientes se entrega de a páginas, no entera.

### RN-busqueda-por-razon-social-o-cuit · origin: Q-04
La búsqueda de clientes encuentra por coincidencia parcial de la razón social o del CUIT.

### RN-cliente-inexistente · origin: Q-02, Q-04
Si se pide ver, modificar, desactivar o reactivar un cliente que no existe, entonces la operación no se realiza y se avisa que ese cliente no existe.

## Requisitos no funcionales
- Ninguno acordado con el usuario. No hay números de tiempo de respuesta ni de volumen: cuando el usuario los fije, se escriben acá y `nzt-verify-performance` mide contra ellos.

## Historias
| Historia | Qué cubre |
|---|---|
| US-005-alta-de-cliente | Alta con los datos mínimos, CUIT repetido, CUIT inválido y correo mal formado |
| US-006-editar-cliente | Modificar la ficha, completar datos opcionales, cliente inexistente |
| US-007-desactivar-cliente | Desactivar, que desaparezca del listado y de la elección, conservar su historial, reactivar |
| US-008-listar-y-buscar-clientes | Recorrer páginas y buscar por razón social o CUIT, incluida la búsqueda sin resultados |

Las historias no se escriben en esta ronda: el plan aprobado no las incluye y los tests los hace el usuario, igual que en F-001 (Q-12).

## Abierto
- Ninguna pregunta abierta.
