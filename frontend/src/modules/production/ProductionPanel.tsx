import { useCallback, useEffect, useRef, useState } from "react";
import { Box, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { Alert } from "../../components/Alert";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Select } from "../../components/Select";
import { Textarea } from "../../components/Textarea";
import { usePermissions } from "../../hooks/usePermissions";
import {
  materialService,
  type Material,
  type WorkOrderMaterial,
} from "../../services/materialService";
import {
  operationService,
  type Operation,
} from "../../services/operationService";
import {
  routeSheetService,
  type RouteSheet,
} from "../../services/routeSheetService";
import {
  workOrderUserService,
  type WorkOrderAssignedUser,
  type WorkOrderUser,
} from "../../services/workOrderUserService";
import {
  workOrderService,
  type WorkOrder,
} from "../../services/workOrderService";
import { errorMessage } from "../../utils/errorMessage";

type Dialog =
  "sheet" | "catalogue" | "material" | "person" | "operation" | "execution";
const titles: Record<Dialog, string> = {
  sheet: "Hoja de ruta",
  catalogue: "Crear material en el catálogo",
  material: "Asignar materia prima a la orden",
  person: "Asignar personal a la orden",
  operation: "Planificar operación",
  execution: "Registrar ejecución",
};
const name = (p?: WorkOrderAssignedUser | null) =>
  p ? `${p.firstName} ${p.lastName}` : "Sin responsable registrado";
const date = (value?: string | null) =>
  value ? new Date(value).toLocaleString("es-AR") : "—";
const inputDate = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 23);
};
const iso = (value: string) => (value ? new Date(value).toISOString() : null);
const editedDate = (value: string, original?: string | null) =>
  original && value === inputDate(original) ? original : iso(value);

export function ProductionPanel({
  workOrder,
  onOrderChanged,
}: {
  workOrder: WorkOrder;
  onOrderChanged: (order: WorkOrder) => void;
}) {
  const { can } = usePermissions();
  const [sheets, setSheets] = useState<RouteSheet[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [materials, setMaterials] = useState<WorkOrderMaterial[]>([]);
  const [personnel, setPersonnel] = useState<WorkOrderUser[]>([]);
  const [catalogue, setCatalogue] = useState<Material[]>([]);
  const [available, setAvailable] = useState<WorkOrderAssignedUser[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [loading, setLoading] = useState(true);
  const [failures, setFailures] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const epoch = useRef(0);
  const mounted = useRef(true);
  const mutable =
    !["COMPLETED", "CANCELLED"].includes(workOrder.status) &&
    Boolean(workOrder.quotationId);
  const canPlan = mutable && can("workOrders:plan");
  const canAssign = mutable && can("workOrders:assign");
  const canExecute =
    mutable &&
    ["APPROVED", "IN_PROGRESS"].includes(workOrder.status) &&
    can("workOrders:execute");
  const activeSheet = sheets.find((s) => String(s.id) === selectedSheet);
  const currentOperation = operations.find((o) => o.id === editId);
  const load = useCallback(async () => {
    const version = ++epoch.current;
    setLoading(true);
    setFailures({});
    setSheets([]);
    setOperations([]);
    setMaterials([]);
    setPersonnel([]);
    const errors: Record<string, string> = {};
    const accept = (section: string, e: unknown) => {
      errors[section] = errorMessage(e);
    };
    await Promise.all([
      routeSheetService
        .getByWorkOrder(workOrder.id)
        .then(async (data) => {
          if (version !== epoch.current) return;
          setSheets(data);
          setSelectedSheet((previous) =>
            data.some((s) => String(s.id) === previous)
              ? previous
              : String(data[0]?.id ?? ""),
          );
          const rows = await Promise.all(
            data.map((s) => operationService.getByRouteSheet(s.id)),
          );
          if (version === epoch.current) setOperations(rows.flat());
        })
        .catch((e) => accept("hojas de ruta/operaciones", e)),
      materialService
        .getByWorkOrder(workOrder.id)
        .then((data) => {
          if (version === epoch.current) setMaterials(data);
        })
        .catch((e) => accept("materiales", e)),
      workOrderUserService
        .getByWorkOrder(workOrder.id)
        .then((data) => {
          if (version === epoch.current) setPersonnel(data);
        })
        .catch((e) => accept("personal", e)),
    ]);
    if (version === epoch.current) {
      setFailures(errors);
      setLoading(false);
    }
  }, [workOrder.id]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      epoch.current++;
    };
  }, [load]);
  const open = async (kind: Dialog, id: number | null = null) => {
    if (busy.current) return;
    setError(null);
    setSuccess(null);
    setEditId(id);
    setDialog(kind);
    const operation = operations.find((o) => o.id === id),
      assignment = materials.find((m) => m.id === id);
    if (kind === "sheet")
      setForm({
        instructions: id
          ? (sheets.find((s) => s.id === id)?.instructions ?? "")
          : "",
      });
    if (kind === "catalogue")
      setForm({
        materialCode: "",
        name: "",
        specification: "",
        manufacturer: "",
      });
    if (kind === "material")
      setForm({
        materialId: String(assignment?.materialId ?? ""),
        lotNumber: assignment?.lotNumber ?? "",
        quantity: String(assignment?.quantity ?? ""),
        unit: assignment?.unit ?? "",
        certificateNumber: assignment?.certificateNumber ?? "",
        receivedAt: inputDate(assignment?.receivedAt),
        notes: assignment?.notes ?? "",
      });
    if (kind === "person") setForm({ userId: "" });
    if (kind === "operation")
      setForm({
        name: operation?.name ?? "",
        description: operation?.description ?? "",
        machine: operation?.machine ?? "",
        plannedStart: inputDate(operation?.plannedStart),
        plannedEnd: inputDate(operation?.plannedEnd),
        notes: operation?.notes ?? "",
      });
    if (kind === "execution")
      setForm({
        actualStart: inputDate(operation?.actualStart),
        actualEnd: "",
      });
    if (kind === "material" || kind === "person") {
      const version = epoch.current;
      busy.current = true;
      setPending(true);
      if (kind === "material") setCatalogue([]);
      else setAvailable([]);
      try {
        if (kind === "material") {
          const data = await materialService.getCatalogue();
          if (mounted.current && version === epoch.current) setCatalogue(data);
        } else {
          const data = await workOrderUserService.getAvailable();
          if (mounted.current && version === epoch.current) setAvailable(data);
        }
      } catch (e) {
        if (mounted.current && version === epoch.current)
          setError(errorMessage(e));
      } finally {
        busy.current = false;
        if (mounted.current) setPending(false);
      }
    }
  };
  const save = async () => {
    if (!dialog || busy.current) return;
    const kind = dialog;
    busy.current = true;
    setPending(true);
    setError(null);
    let orderRefreshError: string | null = null;
    try {
      if (kind === "catalogue") {
        const created = await materialService.createMaterial({
          materialCode: form.materialCode.trim(),
          name: form.name.trim(),
          specification: form.specification.trim() || null,
          manufacturer: form.manufacturer.trim() || null,
        });
        if (mounted.current) setCatalogue((previous) => [...previous, created]);
      } else if (kind === "sheet") {
        const payload = { instructions: form.instructions.trim() || null };
        if (editId) await routeSheetService.update(editId, payload);
        else
          await routeSheetService.create({
            workOrderId: workOrder.id,
            ...payload,
          });
      } else if (kind === "material") {
        if (!form.materialId)
          throw new Error("Seleccioná un material del catálogo.");
        if (
          !/^\d{1,12}(\.\d{1,2})?$/.test(form.quantity) ||
          Number(form.quantity) <= 0
        )
          throw new Error(
            "La cantidad debe ser positiva, con hasta dos decimales y sin exponentes.",
          );
        const payload = {
          quantity: form.quantity,
          lotNumber: form.lotNumber.trim() || null,
          unit: form.unit.trim() || null,
          certificateNumber: form.certificateNumber.trim() || null,
          receivedAt: editedDate(form.receivedAt, materials.find(m => m.id === editId)?.receivedAt),
          notes: form.notes.trim() || null,
        };
        if (editId) await materialService.update(editId, payload);
        else
          await materialService.assign({
            workOrderId: workOrder.id,
            materialId: Number(form.materialId),
            ...payload,
          });
      } else if (kind === "person") {
        if (!form.userId) throw new Error("Seleccioná un usuario activo.");
        await workOrderUserService.assign({
          workOrderId: workOrder.id,
          userId: Number(form.userId),
        });
      } else if (kind === "operation") {
        if (!activeSheet) throw new Error("Seleccioná una hoja de ruta.");
        const payload = {
          name: form.name.trim(),
          description: form.description.trim() || null,
          machine: form.machine.trim() || null,
          plannedStart: editedDate(form.plannedStart, currentOperation?.plannedStart),
          plannedEnd: editedDate(form.plannedEnd, currentOperation?.plannedEnd),
          notes: form.notes.trim() || null,
        };
        if (
          payload.plannedEnd &&
          (!payload.plannedStart || payload.plannedEnd < payload.plannedStart)
        )
          throw new Error(
            "El fin planificado requiere un inicio anterior o igual.",
          );
        if (editId) await operationService.update(editId, payload);
        else
          await operationService.create({
            routeSheetId: activeSheet.id,
            ...payload,
          });
      } else if (kind === "execution" && editId) {
        if (!form.actualStart) throw new Error("Indicá el inicio real.");
        const payload = {
          ...(!currentOperation?.actualStart
            ? { actualStart: iso(form.actualStart)! }
            : {}),
          ...(form.actualEnd ? { actualEnd: iso(form.actualEnd)! } : {}),
        };
        if (!Object.keys(payload).length)
          throw new Error("Indicá la fecha de finalización.");
        await operationService.execute(editId, payload);
        // La ejecución puede iniciar la OT; consultar el estado persistido.
        try {
          const order = await workOrderService.getById(workOrder.id);
          if (mounted.current) onOrderChanged(order);
        } catch (e) {
          orderRefreshError =
            "La ejecución se guardó; no se pudo actualizar el estado de la OT: " +
            errorMessage(e);
        }
      }
      if (mounted.current) {
        setDialog(null);
        setSuccess("Cambios guardados.");
        if (kind !== "catalogue") await load();
        if (orderRefreshError && mounted.current)
          setFailures((previous) => ({
            ...previous,
            orden: orderRefreshError!,
          }));
      }
    } catch (e) {
      if (mounted.current) setError(errorMessage(e));
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  };
  const unassign = async (id: number) => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setSuccess(null);
    setError(null);
    try {
      const updated = await workOrderUserService.unassign(id);
      if (mounted.current) {
        setPersonnel((previous) =>
          previous.map((p) => (p.id === id ? updated : p)),
        );
        setSuccess("Asignación finalizada; el historial se conserva.");
      }
    } catch (e) {
      if (mounted.current) setError(errorMessage(e));
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  };
  const field = (
    key: string,
    label: string,
    options: {
      required?: boolean;
      maxLength?: number;
      type?: string;
      readOnly?: boolean;
    } = {},
  ) => (
    <FormField label={label} required={options.required}>
      <Input
        aria-label={label}
        step={options.type === 'datetime-local' ? 'any' : undefined}
        value={form[key] ?? ""}
        onChange={(e) =>
          setForm((previous) => ({ ...previous, [key]: e.target.value }))
        }
        {...options}
      />
    </FormField>
  );
  const textField = (key: string, label: string) => (
    <FormField label={label}>
      <Textarea
        aria-label={label}
        maxLength={5000}
        value={form[key] ?? ""}
        onChange={(e) =>
          setForm((previous) => ({ ...previous, [key]: e.target.value }))
        }
      />
    </FormField>
  );
  return (
    <VStack align="stretch" gap={6} mt={6}>
      {loading && <Text>Cargando producción…</Text>}
      {Object.entries(failures).map(([section, message]) => (
        <Alert
          key={section}
          status="error"
          title={`No se pudo cargar ${section}`}
          description={message}
        />
      ))}
      {Object.keys(failures).length > 0 && (
        <Button
          variant="outline"
          disabled={pending || loading}
          onClick={() => void load()}
        >
          Reintentar producción
        </Button>
      )}
      {success && <Alert status="success" title={success} />}
      {error && !dialog && (
        <Alert status="error" title="No se pudo guardar" description={error} />
      )}
      {!mutable && (
        <Text fontSize="sm">
          Esta OT conserva su historial. Las modificaciones requieren una OT
          abierta con origen documentado.
        </Text>
      )}
      <Card title="Materia prima y trazabilidad de materiales">
        <HStack mb={3} wrap="wrap">
          {canPlan && (
            <Button
              size="sm"
              disabled={pending || loading || Boolean(failures.materiales)}
              onClick={() => void open("material")}
            >
              Asignar material
            </Button>
          )}
          {can("workOrders:plan") && (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => void open("catalogue")}
            >
              Crear material en catálogo
            </Button>
          )}
        </HStack>
        {!loading && !failures.materiales && materials.length === 0 && (
          <Text>No hay materiales asignados.</Text>
        )}
        <VStack align="stretch" gap={3}>
          {materials.map((m) => (
            <Box key={m.id} borderWidth="1px" p={3} borderRadius="md">
              <Text fontWeight="bold">
                {m.materialName} · {m.material?.materialCode}
              </Text>
              <Text>
                {m.specification || "Sin especificación"} · Fabricante:{" "}
                {m.material?.manufacturer || "—"}
              </Text>
              <Text>
                Lote: {m.lotNumber || "—"} · Cantidad: {m.quantity}{" "}
                {m.unit || ""} · Certificado: {m.certificateNumber || "—"}
              </Text>
              <Text>
                Recepción: {date(m.receivedAt)} · Asignado por:{" "}
                {name(m.assignedBy)}
              </Text>
              {m.notes && <Text>{m.notes}</Text>}
              {canPlan && (
                <Button
                  size="xs"
                  variant="outline"
                  disabled={pending || loading}
                  onClick={() => void open("material", m.id)}
                >
                  Editar partida {m.lotNumber || m.id}
                </Button>
              )}
            </Box>
          ))}
        </VStack>
      </Card>
      <Card title="Personal asignado a la orden">
        {canAssign && (
          <Button
            mb={3}
            size="sm"
            disabled={pending || loading || Boolean(failures.personal)}
            onClick={() => void open("person")}
          >
            Asignar personal
          </Button>
        )}
        {!loading && !failures.personal && personnel.length === 0 && (
          <Text>No hay personal asignado.</Text>
        )}
        <VStack align="stretch" gap={3}>
          {personnel.map((p) => (
            <Box key={p.id} borderWidth="1px" p={3} borderRadius="md">
              <Text fontWeight="bold">
                {name(p.user)} · {p.user?.role || "Sin rol"}{" "}
                {!p.user?.isActive && "(Usuario inactivo)"}
              </Text>
              <Text>
                Asignado: {date(p.assignedAt)} · Por: {name(p.assignedBy)}
              </Text>
              {p.unassignedAt ? (
                <Text>
                  Baja: {date(p.unassignedAt)} · Por: {name(p.unassignedBy)}
                </Text>
              ) : (
                <Badge colorPalette="green">Asignación activa</Badge>
              )}
              {canAssign && !p.unassignedAt && (
                <Button
                  ml={2}
                  size="xs"
                  variant="outline"
                  disabled={pending || loading}
                  onClick={() => void unassign(p.id)}
                >
                  Quitar asignación de {name(p.user)}
                </Button>
              )}
            </Box>
          ))}
        </VStack>
      </Card>
      <Card title="Hoja de ruta y operaciones de produccion">
        <HStack mb={3} wrap="wrap">
          {canPlan && (
            <Button
              size="sm"
              disabled={
                pending ||
                loading ||
                Boolean(failures["hojas de ruta/operaciones"])
              }
              onClick={() => void open("sheet")}
            >
              Crear hoja de ruta
            </Button>
          )}
          {activeSheet && canPlan && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={pending || loading}
                onClick={() => void open("sheet", activeSheet.id)}
              >
                Editar instrucciones
              </Button>
              <Button
                size="sm"
                disabled={pending || loading}
                onClick={() => void open("operation")}
              >
                Agregar operación
              </Button>
            </>
          )}
        </HStack>
        {sheets.length > 0 && (
          <FormField label="Hoja de ruta">
            <Select
              aria-label="Hoja de ruta"
              value={selectedSheet}
              disabled={pending}
              onChange={(e) => setSelectedSheet(e.target.value)}
            >
              {sheets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.routeNumber}
                </option>
              ))}
            </Select>
          </FormField>
        )}
        {activeSheet?.instructions && (
          <Text mt={2}>{activeSheet.instructions}</Text>
        )}
        {!loading &&
          !failures["hojas de ruta/operaciones"] &&
          sheets.length === 0 && (
            <Text>No se emitió una hoja de ruta para esta orden.</Text>
          )}
        {activeSheet &&
          !loading &&
          !failures["hojas de ruta/operaciones"] &&
          !operations.some((o) => o.routeSheetId === activeSheet.id) && (
            <Text>No hay operaciones en esta hoja de ruta.</Text>
          )}
        <VStack mt={3} align="stretch" gap={3}>
          {operations
            .filter((o) => String(o.routeSheetId) === selectedSheet)
            .map((o) => (
              <Box key={o.id} borderWidth="1px" p={3} borderRadius="md">
                <HStack>
                  <Text fontWeight="bold">
                    {o.operationNumber} · {o.name}
                  </Text>
                  <Badge
                    colorPalette={
                      o.actualEnd ? "green" : o.actualStart ? "blue" : "gray"
                    }
                  >
                    {o.actualEnd
                      ? "Completada"
                      : o.actualStart
                        ? "En proceso"
                        : "Programada"}
                  </Badge>
                </HStack>
                <Text>{o.description}</Text>
                <Text>Máquina: {o.machine || "—"}</Text>
                <Text>
                  Planificado: {date(o.plannedStart)} → {date(o.plannedEnd)}
                </Text>
                <Text>
                  Real: {date(o.actualStart)} → {date(o.actualEnd)}
                </Text>
                <Text>
                  Planificado por: {name(o.createdBy)} · Ejecución registrada
                  por: {name(o.executedBy)}
                </Text>
                {o.notes && <Text>{o.notes}</Text>}
                <HStack mt={2}>
                  {canPlan && !o.actualStart && (
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={pending || loading}
                      onClick={() => void open("operation", o.id)}
                    >
                      Editar {o.operationNumber}
                    </Button>
                  )}
                  {canExecute && !o.actualEnd && (
                    <Button
                      size="xs"
                      disabled={pending || loading}
                      onClick={() => void open("execution", o.id)}
                    >
                      Registrar ejecución {o.operationNumber}
                    </Button>
                  )}
                </HStack>
              </Box>
            ))}
        </VStack>
        {workOrder.status === "PENDING" && (
          <Text mt={3} fontSize="sm">
            Podés planificar. La ejecución requiere aprobación interna.
          </Text>
        )}
      </Card>
      <Modal
        open={Boolean(dialog)}
        onOpenChange={({ open: isOpen }) => {
          if (!isOpen && !busy.current) setDialog(null);
        }}
        title={dialog ? titles[dialog] : ""}
        footer={
          <HStack>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setDialog(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="production-form"
              disabled={
                pending ||
                (dialog === "person" &&
                  !available.some(
                    (p) =>
                      !personnel.some(
                        (a) => a.userId === p.id && !a.unassignedAt,
                      ),
                  )) ||
                (dialog === "material" && !catalogue.length)
              }
            >
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </HStack>
        }
      >
        <form
          id="production-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <VStack align="stretch" gap={3}>
            {error && (
              <Alert
                status="error"
                title="No se pudo guardar"
                description={error}
              />
            )}
            {dialog === "sheet" && (
              <>
                {textField("instructions", "Instrucciones técnicas")}
                <Text fontSize="sm">
                  El número y el autor se asignan en el servidor.
                </Text>
              </>
            )}
            {dialog === "catalogue" && (
              <>
                {field("materialCode", "Código de material", {
                  required: true,
                  maxLength: 100,
                })}
                {field("name", "Nombre del material", {
                  required: true,
                  maxLength: 500,
                })}
                {textField("specification", "Especificación")}
                {field("manufacturer", "Fabricante", { maxLength: 500 })}
              </>
            )}
            {dialog === "material" && (
              <>
                <FormField label="Material del catálogo" required>
                  <Select
                    aria-label="Material del catálogo"
                    disabled={Boolean(editId) || pending}
                    value={form.materialId ?? ""}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        materialId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Seleccionar material</option>
                    {catalogue.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.materialCode} · {m.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                {!pending && !error && !catalogue.length && (
                  <Text>
                    No hay materiales disponibles. Creá uno en el catálogo antes
                    de asignarlo.
                  </Text>
                )}
                <SimpleGrid columns={2} gap={3}>
                  {field("lotNumber", "Lote", { maxLength: 100 })}
                  {field("quantity", "Cantidad", { required: true })}
                  {field("unit", "Unidad", { maxLength: 20 })}
                  {field("certificateNumber", "Certificado", {
                    maxLength: 100,
                  })}
                </SimpleGrid>
                {field("receivedAt", "Fecha de recepción", {
                  type: "datetime-local",
                })}
                {textField("notes", "Observaciones de recepción")}
              </>
            )}
            {dialog === "person" && (
              <>
                <FormField label="Usuario activo" required>
                  <Select
                    aria-label="Usuario activo"
                    value={form.userId ?? ""}
                    disabled={pending}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        userId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Seleccionar usuario</option>
                    {available
                      .filter(
                        (p) =>
                          !personnel.some(
                            (a) => a.userId === p.id && !a.unassignedAt,
                          ),
                      )
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {name(p)} · {p.role}
                        </option>
                      ))}
                  </Select>
                </FormField>
                <Text fontSize="sm">
                  Una asignación activa por usuario y OT. Se conservan el rol
                  del sistema, la fecha y el responsable de la asignación.
                </Text>
                {!pending &&
                  !error &&
                  !available.some(
                    (p) =>
                      !personnel.some(
                        (a) => a.userId === p.id && !a.unassignedAt,
                      ),
                  ) && (
                    <Text>
                      No hay usuarios activos disponibles para asignar.
                    </Text>
                  )}
              </>
            )}
            {dialog === "operation" && (
              <>
                {field("name", "Nombre de la operación", {
                  required: true,
                  maxLength: 500,
                })}
                {textField("description", "Descripción de la operación")}
                {field("machine", "Máquina o estación", { maxLength: 500 })}
                {field("plannedStart", "Inicio planificado", {
                  type: "datetime-local",
                })}
                {field("plannedEnd", "Fin planificado", {
                  type: "datetime-local",
                })}
                {textField("notes", "Notas de planificación")}
                <Text fontSize="sm">
                  El número de operación se asigna automáticamente dentro de la
                  hoja seleccionada.
                </Text>
              </>
            )}
            {dialog === "execution" && (
              <>
                {field("actualStart", "Inicio real", {
                  required: true,
                  type: "datetime-local",
                  readOnly: Boolean(currentOperation?.actualStart),
                })}
                {field("actualEnd", "Fin real", { type: "datetime-local" })}
                <Text fontSize="sm">
                  Las fechas registradas se conservan. Finalizar una operación
                  no completa automáticamente toda la OT.
                </Text>
              </>
            )}
          </VStack>
        </form>
      </Modal>
    </VStack>
  );
}
