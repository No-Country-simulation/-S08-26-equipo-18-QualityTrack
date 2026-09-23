import { Badge, type BadgeProps } from "../../components/Badge";
import type { WorkOrderPriority } from "../../services/workOrderService";

export interface PriorityBadgeProps extends Omit<BadgeProps, "children"> {
  priority: WorkOrderPriority;
}

export const WORK_ORDER_PRIORITY_CONFIG: Record<
  WorkOrderPriority,
  { label: string; colorPalette: string }
> = {
  LOW: { label: "Baja", colorPalette: "gray" },
  MEDIUM: { label: "Media", colorPalette: "blue" },
  HIGH: { label: "Alta", colorPalette: "orange" },
  URGENT: { label: "Urgente", colorPalette: "red" },
};

export function PriorityBadge({ priority, ...props }: PriorityBadgeProps) {
  const config = WORK_ORDER_PRIORITY_CONFIG[priority] || {
    label: priority,
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

export default PriorityBadge;

