# F-002 · Clientes — análisis

Registro append-only. Una respuesta reemplazada se marca con qué la reemplazó; nunca se borra.

## Q-01 — Identificación fiscal del cliente
- **Pregunta:** ¿cómo se identifica fiscalmente un cliente y qué pasa si dos comparten el número?
- **Contexto del agente:** el número fiscal se guardaba como número entero y un CUIT de 11 dígitos no entra en ese tipo; toda alta real fallaba.
- **Respuesta (usuario, 2026-09-22):** el CUIT es texto de 11 dígitos, obligatorio y único entre clientes. Se valida el formato y el dígito verificador, para que no entre un número inventado.

## Q-02 — Baja de un cliente
- **Pregunta:** un cliente ya tiene solicitudes, cotizaciones y órdenes de trabajo asociadas y la persona lo elimina de la lista, ¿qué pasa?
- **Respuesta (usuario, 2026-09-22):** no se borra: se desactiva. Desaparece de la lista y de los desplegables, su historial sigue existiendo y las solicitudes viejas siguen mostrando de quién eran. Se puede reactivar.

## Q-03 — Datos obligatorios del alta
- **Pregunta:** ¿qué datos no pueden faltar al dar de alta un cliente?
- **Respuesta (usuario, 2026-09-22):** razón social, CUIT, correo y teléfono. Nombre de contacto, dirección, ciudad, provincia y notas son opcionales y se completan cuando se saben.

## Q-04 — Forma del listado
- **Pregunta:** ¿cómo se ve la lista de clientes cuando crezca?
- **Respuesta (usuario, 2026-09-22):** paginada, con una búsqueda por razón social o CUIT.

## Observaciones sobre lo que ya existe (no son reglas hasta que el usuario las confirme)
- La pantalla de clientes del frontend ya existe y hoy exige nombre de contacto para guardar, lo que contradice Q-03. Se alinea al implementar.
- La pantalla pide todos los clientes de una sola vez y filtra en memoria; con Q-04 pasa a pedir páginas.

## Notas técnicas (las resuelve arquitectura, no este documento)
- Tipo de dato del CUIT en la base y unicidad a nivel de esquema.
- Cómo se representa la desactivación y cómo la respetan los listados y las relaciones existentes.
- Forma de la respuesta paginada y del parámetro de búsqueda.

## Abierto
- Ninguna pregunta abierta.
