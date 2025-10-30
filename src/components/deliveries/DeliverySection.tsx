"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface DeliverySectionProps {
  title: string;
  icon: React.ReactNode;
  deliveries: any[];
  onStatusUpdate: (deliveryId: string, newStatus: string) => void;
  onCallCustomer: (phone: string) => void;
  emptyMessage: string;
  defaultCollapsed?: boolean;
}

export default function DeliverySection({
  title,
  icon,
  deliveries,
  onStatusUpdate,
  onCallCustomer,
  emptyMessage,
  defaultCollapsed = false,
}: DeliverySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (deliveries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title} ({deliveries.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="border rounded-lg p-4">
                {/* You can customize this preview or use DeliveryCard */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {delivery.customerName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {delivery.customerPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ₹{delivery.totalAmount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-sm text-gray-500">
                      {delivery.items.length} item
                      {delivery.items.length > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                {/* Add quick actions here if needed */}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
