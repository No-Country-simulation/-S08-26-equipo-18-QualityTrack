// Estados posibles durante el ciclo de vida de una Orden de Trabajo.

export enum WorkOrderStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}