"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Package,
  Calendar,
  Phone,
  MessageCircle,
} from "lucide-react";
import StatusQuickActions from "./StatusQuickActions";

interface Delivery {
  id: string;
  saleId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    city: string;
    district: string;
    pincode: string;
  } | null;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  totalAmount: number;
  deliveryDate: string | null;
  deliveryStatus: "pending" | "scheduled" | "delivered" | "partial";
  saleDate: string;
  notes?: string;
}

interface DeliveryCardProps {
  delivery: Delivery;
  onStatusUpdate: (
    deliveryId: string,
    newStatus: Delivery["deliveryStatus"]
  ) => void;
  onCallCustomer: (phone: string) => void;
}

export default function DeliveryCard({
  delivery,
  onStatusUpdate,
  onCallCustomer,
}: DeliveryCardProps) {
  const getStatusConfig = (status: Delivery["deliveryStatus"]) => {
    const config = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        label: "Pending",
      },
      scheduled: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Truck,
        label: "Scheduled",
      },
      delivered: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        label: "Delivered",
      },
      partial: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: AlertCircle,
        label: "Partial",
      },
    };
    return config[status];
  };

  const statusConfig = getStatusConfig(delivery.deliveryStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-4 space-y-4">
        {/* Header - Customer & Status */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {delivery.customerName}
              </h3>
              <Badge
                variant="secondary"
                className={`${statusConfig.color} border font-medium`}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{delivery.customerPhone}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Delivery Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div>
              <div className="text-gray-500">Delivery Date</div>
              <div className="font-medium">
                {delivery.deliveryDate
                  ? new Date(delivery.deliveryDate).toLocaleDateString("en-IN")
                  : "Not set"}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-green-500 flex-shrink-0" />
            <div>
              <div className="text-gray-500">Amount</div>
              <div className="font-medium">
                ₹{delivery.totalAmount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-700 mb-2">Items</div>
          <div className="space-y-1">
            {delivery.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate flex-1">
                  {item.name}
                </span>
                <span className="text-gray-900 font-medium ml-2">
                  ×{item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Address */}
        {delivery.deliveryAddress && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-gray-500 mb-1">Delivery Address</div>
              <div className="text-gray-700 space-y-0.5">
                <div>{delivery.deliveryAddress.street}</div>
                <div>
                  {delivery.deliveryAddress.city},{" "}
                  {delivery.deliveryAddress.district}
                </div>
                <div className="font-medium">
                  {delivery.deliveryAddress.pincode}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onCallCustomer(delivery.customerPhone)}
          >
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          <StatusQuickActions
            delivery={delivery}
            onStatusUpdate={onStatusUpdate}
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}
