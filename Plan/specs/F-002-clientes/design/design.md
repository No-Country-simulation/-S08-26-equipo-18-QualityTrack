# Diseño — F-002 Clientes

Participan dos componentes que ya existen: `frontend` (la pantalla de clientes, que ya está construida) y `backend` (la API, que todavía no tiene el módulo). No hay terceros involucrados.

## Flujos

**Alta de un cliente (US-005)**
1. `frontend` valida la forma de lo cargado — obligatorios, correo y los 11 dígitos del CUIT — y avisa sin llamar a la API si algo falta.
2. `frontend` envía la ficha a `backend`.
3. `backend` vuelve a validar todo: lo que llega del navegador no se confía. Normaliza el CUIT a dígitos y el correo a minúsculas.
4. `backend` comprueba que no exista otro cliente con ese CUIT y guarda. El cliente nace activo.
5. Si dos altas con el mismo CUIT llegan a la vez, la que pierde no rompe: el índice único la rechaza y `backend` responde el mismo aviso de CUIT ya registrado (QT-13).
6. `frontend` muestra el cliente nuevo en la lista.

**Edición de un cliente (US-006)**
1. `frontend` envía los campos modificados a `backend`.
2. `backend` valida igual que en el alta, y si el CUIT cambió comprueba que no lo tenga otro cliente (QT-06).
3. Si el cliente no existe, `backend` lo dice y no escribe nada.
4. Un campo opcional que se vacía queda ausente, no como texto vacío (QT-14).

**Desactivar y reactivar (US-007)**
1. `frontend` pide el cambio de estado a `backend`.
2. `backend` marca el cliente como inactivo o activo. No borra nada, y el trabajo asociado queda intacto porque nada lo referencia por estado.
3. Repetir la operación deja el mismo resultado y no falla (QT-10).
4. `frontend` lo saca de la lista de activos. Para volver a encontrarlo, pide la lista con el filtro de inactivos (QT-04).

**Listar y buscar (US-008)**
1. `frontend` pide una página a `backend`, con el término de búsqueda y el filtro de estado si los hay.
2. `backend` devuelve los clientes de esa página y el total de coincidencias, ordenados por razón social (QT-07, QT-09).
3. Por omisión solo vienen los activos.
4. Si no hay coincidencias, la respuesta es una página vacía con total cero: no es un error.

## Dónde se hace cumplir cada regla

| Regla | Dónde se hace cumplir |
|---|---|
| RN-cuit-identifica-al-cliente | `backend`, al validar la entrada: normaliza a dígitos y exige once |
| RN-cuit-irrepetible | `backend`: índice único sobre el CUIT — **la fuente de verdad** — más una comprobación previa que existe solo para dar un aviso entendible (QT-13) |
| RN-cuit-invalido | `backend`, validación de entrada (formato y dígito verificador). `frontend` repite la comprobación solo para avisar antes de enviar (QT-02) |
| RN-datos-minimos-del-cliente | `backend`, validación de entrada. `frontend` lo repite para no mandar una ficha incompleta |
| RN-correo-de-contacto-valido | `backend`, validación de entrada. `frontend` lo repite para avisar antes |
| RN-datos-complementarios-opcionales | `backend`: esos campos aceptan ausencia, en el alta y en la edición (QT-14) |
| RN-clientes-no-se-eliminan | `backend`: no existe ninguna operación que borre un cliente |
| RN-cliente-desactivado-no-se-ofrece | `backend`: el listado filtra por estado y devuelve solo activos si no le piden otra cosa (QT-04) |
| RN-historial-del-cliente-desactivado | `backend`: la desactivación no toca ninguna relación; el trabajo asociado sigue apuntando al cliente |
| RN-cliente-reactivable | `backend`: la operación de estado vuelve a activarlo con sus datos intactos |
| RN-listado-por-paginas | `backend`: el listado siempre pagina, con un tope máximo de tamaño de página (QT-07) |
| RN-busqueda-por-razon-social-o-cuit | `backend`: comparación parcial sin distinguir mayúsculas sobre razón social y CUIT (QT-08) |
| RN-cliente-inexistente | `backend`: toda operación sobre un cliente que no existe responde que no existe, y no escribe |

Ninguna regla se hace cumplir solo en el frontend: lo que valida la pantalla es comodidad para la persona, no control.

## Datos

El cliente ya existe como entidad y esta feature la ajusta, no la reemplaza:

- **CUIT**: pasa de número entero a texto de once dígitos, con índice único (QT-01, QT-13). **Es un cambio de tipo sobre una columna que ya está en la base**: la migración tiene que convertir lo que haya cargado.
- **Estado**: campo booleano nuevo, activo por omisión (QT-03).
- **Razón social, correo y teléfono**: obligatorios, como ya lo eran en el esquema.
- **Nombre de contacto, dirección, ciudad, provincia y notas**: pasan a aceptar ausencia (QT-14). Es lo que cambia respecto de hoy, donde el esquema los exigía todos.
- **Alta y última modificación**: las trae la entidad base que ya usa el resto del modelo. No se agregan campos de auditoría propios de clientes: nadie los pidió.

Nada se congela en el tiempo: la ficha del cliente es el dato actual, y ningún documento de negocio depende todavía de una copia de ella. Cuando existan cotizaciones, habrá que decidir si guardan los datos del cliente del momento; eso es de su feature, no de esta.

## Estados

El cliente tiene dos: **activo** e **inactivo**. Nace activo, y las dos transiciones son legales en ambos sentidos y repetibles (QT-10). No hay ningún otro estado, y ninguna operación lo borra.

## Cuando un paso falla

- El alta y la edición escriben **una sola cosa**: no hay un segundo efecto que pueda quedar a medias.
- Si la base rechaza el alta por CUIT repetido después de que la comprobación previa dijo que estaba libre — dos altas simultáneas —, no se guarda nada y la persona recibe el mismo aviso que si lo hubiera detectado antes (QT-13).
- Desactivar y reactivar son repetibles sin consecuencia: si la respuesta se pierde y la pantalla reintenta, el resultado es el mismo (QT-10).

## Integraciones

Ninguna. Esta feature no sale del producto.

## Preguntas abiertas

Ninguna. Las decisiones que la produjeron están en `decisions.md`: QT-01 a QT-14.
