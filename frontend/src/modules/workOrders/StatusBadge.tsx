import { Badge, type BadgeProps } from "../../components/Badge";
import type { WorkOrderStatus } from "../../services/workOrderService";

export interface StatusBadgeProps extends Omit<BadgeProps, "children"> {
  status: WorkOrderStatus;
}

export const WORK_ORDER_STATUS_CONFIG: Record<
  WorkOrderStatus,
  { label: string; colorPalette: string }
> = {
  PENDING: { label: "Pendiente", colorPalette: "yellow" },
  APPROVED: { label: "Aprobada", colorPalette: "cyan" },
  IN_PROGRESS: { label: "En progreso", colorPalette: "blue" },
  COMPLETED: { label: "Completada", colorPalette: "green" },
  CANCELLED: { label: "Cancelada", colorPalette: "red" },
};

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const config = WORK_ORDER_STATUS_CONFIG[status] || {
    label: status,
    colorPalette: "gray",
  };
  return (
    <Badge
      colorPalette={config.colorPalette}
      variant="subtle"
      size="sm"
      {...props}
    >
      {config.label}
    </Badge>
  );
}

export default StatusBadge;

