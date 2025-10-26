// app/api/customers/[id]/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("=== PROFILE API CALLED ===");
    console.log("Customer ID:", params.id);

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No auth header found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      console.log("Invalid token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.log("User ID from token:", decoded.id);

    const customerId = params.id;

    // Get customer basic information
    const customer = await db.customer.findUnique({
      where: {
        id: customerId,
        userId: decoded.id,
      },
    });

    console.log("Customer found:", !!customer);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get customer sales (simplified version)
    const sales = await db.sale.findMany({
      where: {
        customerId: customerId,
        userId: decoded.id,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("Sales found:", sales.length);

    // Calculate basic statistics
    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPaid = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
    const dueAmount = totalAmount - totalPaid;

    // Format sales data (simplified)
    const formattedSales = sales.map((sale) => ({
      id: sale.id,
      invoiceNo: sale.invoiceNo,
      date: sale.createdAt.toISOString(),
      items: [], // Empty for now to avoid database relation issues
      totalAmount: sale.totalAmount,
      discount: sale.discount || 0,
      transportCharges: sale.transportCharges || 0,
      finalAmount:
        sale.totalAmount - (sale.discount || 0) + (sale.transportCharges || 0),
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      status: sale.status,
      paymentType: sale.paymentType || "cash",
      dueDate: sale.dueDate?.toISOString(),
      notes: sale.notes,
      payments: [], // Empty for now to avoid database relation issues
    }));

    const customerProfile = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: {
        street: customer.address?.street || "",
        city: customer.address?.city || "",
        district: customer.address?.district || "",
        pincode: customer.address?.pincode || "",
      },
      createdAt: customer.createdAt.toISOString(),
      customerType: customer.customerType || "individual",
      gstNumber: customer.gstNumber,
      referredBy: customer.referredBy,
      creditLimit: customer.creditLimit,
      preferredContact: customer.preferredContact || "call",
      notes: customer.notes,
      status: customer.status || "active",

      stats: {
        totalSales,
        totalAmount,
        totalPaid,
        dueAmount,
        purchaseCount: totalSales,
        paidSalesCount: sales.filter((s) => s.status === "paid").length,
        pendingSalesCount: sales.filter((s) => s.status === "pending").length,
        partialSalesCount: sales.filter((s) => s.status === "partial").length,
        averageSaleValue: totalSales > 0 ? totalAmount / totalSales : 0,
        monthlyAverage: totalAmount / 12,
        lifetimeValue: totalAmount,
        averageDelayDays: 0,
        lastPurchaseDate:
          sales.length > 0 ? sales[0].createdAt.toISOString() : null,
      },

      sales: formattedSales,
      paymentHistory: [],

      summary: {
        totalRevenue: totalAmount,
        totalCollected: totalPaid,
        totalPending: dueAmount,
        averageSaleValue: totalSales > 0 ? totalAmount / totalSales : 0,
      },
    };

    console.log("=== PROFILE API SUCCESS ===");
    return NextResponse.json(customerProfile);
  } catch (error: any) {
    console.error("Customer profile fetch error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Failed to fetch customer profile: " + error.message },
      { status: 500 }
    );
  }
}
