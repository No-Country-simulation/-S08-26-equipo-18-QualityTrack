# Decisiones de diseño — F-002 Clientes

Registro append-only. Una respuesta reemplazada se marca con qué la reemplazó; nunca se borra.

Modo elegido: **propuestas** · 2026-09-22 — el mismo modo que el usuario confirmó para las decisiones del producto. El agente decide los detalles dentro del alcance, etiquetados, y el usuario objeta lo que no le sirva.

## 2026-09-22

**QT-01 · ¿Con qué tipo se guarda el CUIT, si hoy es un entero que no lo soporta?**
> Texto de 11 caracteres, solo dígitos, sin guiones ni puntos. Un CUIT no es una cantidad: no se suma ni se ordena como número, y guardado como entero pierde los ceros a la izquierda además de desbordar. La entrada se normaliza quitando todo lo que no sea dígito antes de validar y guardar. — `agente, dentro del alcance`

**QT-02 · ¿Dónde se valida el dígito verificador del CUIT (RN-cuit-invalido)?**
> En el backend, en la validación de entrada de la operación, que es la que decide. El frontend repite la comprobación solo para avisar antes de enviar; su resultado no es el que manda. — `agente, dentro del alcance`

**QT-03 · ¿Cómo se representa que un cliente está desactivado (RN-clientes-no-se-eliminan)?**
> Un campo booleano `isActive` en el cliente, verdadero por omisión. Se descartó `deletedAt` con fecha: la fecha sugiere un borrado que acá no existe, y la reactivación (RN-cliente-reactivable) la volvería una fecha que va y viene. Resuelve el TODO que estaba escrito en la entidad. — `agente, dentro del alcance`

**QT-04 · Un cliente desactivado no aparece en la lista, pero hay que poder reactivarlo: ¿cómo se llega a él?**
> El listado acepta un filtro explícito de estado con tres valores — activos, inactivos, todos — y por omisión devuelve solo los activos, que es lo que la regla pide. La pantalla ofrece ver los inactivos cuando la persona lo pide. Sin esto, un cliente desactivado sería inalcanzable y RN-cliente-reactivable no se podría cumplir. — `agente, dentro del alcance` · el usuario puede objetarlo: toca cómo se lee RN-cliente-desactivado-no-se-ofrece

**QT-05 · ¿El CUIT de un cliente desactivado sigue ocupado?**
> Sí. La unicidad no mira el estado: el cliente sigue existiendo y puede reactivarse, así que cargar otro con el mismo CUIT crearía dos fichas para la misma empresa. Si alguien intenta darlo de alta, se le avisa que ese CUIT ya está registrado. — `agente, dentro del alcance`

**QT-06 · ¿Se puede editar el CUIT de un cliente ya cargado?**
> Sí, con las mismas reglas que el alta: formato, dígito verificador y unicidad. Nada en la spec lo prohíbe y un CUIT mal tipeado tiene que poder corregirse. — `agente, dentro del alcance`

**QT-07 · ¿Qué forma tiene la respuesta del listado paginado (RN-listado-por-paginas)?**
> Un objeto con los elementos de la página y el total de coincidencias, más la página y el tamaño pedidos. El total es lo que le permite a la pantalla dibujar el paginador; devolver solo el arreglo obliga a adivinar cuántas páginas hay. Parámetros `page` (desde 1) y `limit`, con 20 por omisión y 100 como máximo. — `agente, dentro del alcance`

**QT-08 · ¿Cómo busca el parámetro de búsqueda (RN-busqueda-por-razon-social-o-cuit)?**
> Un solo parámetro de texto que compara sin distinguir mayúsculas contra la razón social y contra el CUIT, por coincidencia parcial en cualquier posición. Del término de búsqueda se comparan también solo sus dígitos contra el CUIT, para que encuentre igual si la persona lo escribe con guiones. — `agente, dentro del alcance`

**QT-09 · ¿En qué orden vienen los clientes y cómo se mantiene estable entre páginas?**
> Por razón social ascendente, desempatando por identificador. Sin el desempate, dos clientes con la misma razón social pueden intercambiarse entre una página y la siguiente y aparecer repetidos o perdidos. — `agente, dentro del alcance`

**QT-10 · ¿Qué pasa si se desactiva un cliente que ya está inactivo, o se reactiva uno activo?**
> La operación no falla: deja al cliente en el estado pedido y responde lo mismo que si hubiera cambiado. Repetir la acción es seguro y no hay nada que avisar. — `agente, dentro del alcance`

**QT-11 · ¿El correo del cliente se normaliza, como el de los usuarios?**
> Sí: se recorta y se pasa a minúsculas antes de guardarlo, igual que en usuarios. No lleva unicidad: dos clientes distintos pueden compartir el correo de una misma administración, y la spec no lo prohíbe. — `agente, dentro del alcance`

**QT-12 · ¿El teléfono tiene formato obligatorio?**
> No. Texto libre con largo máximo: hay fijos, celulares, internos y números del exterior, y el usuario no pidió un formato. Solo se exige que esté (RN-datos-minimos-del-cliente). — `agente, dentro del alcance`

**QT-13 · ¿Qué índices necesita la tabla de clientes?**
> Uno único sobre el CUIT, que es lo que hace cierta RN-cuit-irrepetible incluso si dos altas llegan a la vez; y uno sobre la razón social, que es el orden por omisión del listado. La búsqueda parcial no se apoya en ellos y recorre la tabla: con el volumen de clientes de este producto es aceptable, y queda anotado por si crece. — `agente, dentro del alcance`

**QT-14 · ¿Los campos opcionales viajan vacíos o ausentes?**
> Se guardan como ausentes cuando no se cargan, no como texto vacío. Así "no lo sé" y "está vacío" no se confunden, y la ficha puede completarse después sin reenviar el resto (RN-datos-complementarios-opcionales). — `agente, dentro del alcance`

## 2026-09-22 (durante la implementación)

**QT-15 · ¿En qué orden se normalizan y se validan los datos de entrada?**
> Primero se normaliza, después se valida. Se encontró probándolo: un correo pegado con un espacio al final se rechazaba por inválido en lugar de recortarse, y lo mismo pasaba con un CUIT escrito con guiones frente al largo máximo. Recortar y bajar a minúsculas ocurre al recibir el dato, antes de que las validaciones lo miren. — `agente, dentro del alcance`

## Abierto
- Ninguna pregunta sin responder.
