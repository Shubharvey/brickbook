"use client";

import { Button } from "@/components/ui/button";
import {
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Delivery {
  id: string;
  deliveryStatus: "pending" | "scheduled" | "delivered" | "partial";
}

interface StatusQuickActionsProps {
  delivery: Delivery;
  onStatusUpdate: (
    deliveryId: string,
    newStatus: Delivery["deliveryStatus"]
  ) => void;
  compact?: boolean;
}

const statusOptions = [
  {
    value: "pending" as const,
    label: "Mark as Pending",
    icon: Clock,
    color: "text-yellow-600",
  },
  {
    value: "scheduled" as const,
    label: "Mark as Scheduled",
    icon: Truck,
    color: "text-blue-600",
  },
  {
    value: "delivered" as const,
    label: "Mark as Delivered",
    icon: CheckCircle,
    color: "text-green-600",
  },
  {
    value: "partial" as const,
    label: "Mark as Partial",
    icon: AlertCircle,
    color: "text-orange-600",
  },
];

export default function StatusQuickActions({
  delivery,
  onStatusUpdate,
  compact = false,
}: StatusQuickActionsProps) {
  // Get next logical status for quick action
  const getNextStatus = (currentStatus: Delivery["deliveryStatus"]) => {
    switch (currentStatus) {
      case "pending":
        return "scheduled";
      case "scheduled":
        return "delivered";
      case "partial":
        return "delivered";
      default:
        return currentStatus;
    }
  };

  const nextStatus = getNextStatus(delivery.deliveryStatus);
  const nextStatusOption = statusOptions.find(
    (opt) => opt.value === nextStatus
  );

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {nextStatusOption ? (
              <>
                <nextStatusOption.icon className="h-4 w-4 mr-2" />
                Update
              </>
            ) : (
              <>
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Status
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onStatusUpdate(delivery.id, option.value)}
              className="flex items-center gap-2"
            >
              <option.icon className={`h-4 w-4 ${option.color}`} />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full button group for desktop
  return (
    <div className="flex flex-wrap gap-2">
      {statusOptions.map((option) => (
        <Button
          key={option.value}
          variant={
            delivery.deliveryStatus === option.value ? "default" : "outline"
          }
          size="sm"
          onClick={() => onStatusUpdate(delivery.id, option.value)}
          className="flex items-center gap-2"
        >
          <option.icon className="h-4 w-4" />
          {option.label.replace("Mark as ", "")}
        </Button>
      ))}
    </div>
  );
}
