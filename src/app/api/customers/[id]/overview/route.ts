import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Fetch customer with all sales data
    const customer = await db.customer.findUnique({
      where: {
        id: params.id,
        userId: decoded.id,
      },
      include: {
        sales: {
          include: {
            payments: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Calculate brick types and totals with proper item parsing
    let brickTypes: { [key: string]: number } = {};
    let totalBricks = 0;
    let totalSaleAmount = 0;
    let totalDueAmount = 0;
    let totalPaidAmount = 0;
    let salesCount = customer.sales.length;

    customer.sales.forEach((sale) => {
      totalSaleAmount += sale.totalAmount;
      totalDueAmount += sale.dueAmount;
      totalPaidAmount += sale.paidAmount;

      // Process items with proper parsing
      let items = [];
      try {
        if (typeof sale.items === "string") {
          items = JSON.parse(sale.items);
        } else if (Array.isArray(sale.items)) {
          items = sale.items;
        }
      } catch (error) {
        console.error("Error parsing items in overview:", error);
        items = [];
      }

      items.forEach((item: any) => {
        const brickType = item.brickType || item.type || "Unknown";
        const quantity = Number(item.quantity) || 0;

        brickTypes[brickType] = (brickTypes[brickType] || 0) + quantity;
        totalBricks += quantity;
      });
    });

    // Convert brick types to array for easier frontend use
    const brickTypesArray = Object.entries(brickTypes).map(([type, count]) => ({
      type,
      count,
      percentage: totalBricks > 0 ? (count / totalBricks) * 100 : 0,
    }));

    // Calculate payment completion rate
    const paymentCompletionRate =
      totalSaleAmount > 0 ? (totalPaidAmount / totalSaleAmount) * 100 : 0;

    // Prepare recent sales with proper data
    const recentSales = customer.sales.slice(0, 5).map((sale) => ({
      id: sale.id,
      invoiceNo: sale.invoiceNo,
      date: sale.createdAt.toISOString(),
      amount: sale.totalAmount,
      status: sale.status,
      dueAmount: sale.dueAmount,
    }));

    const overviewData = {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        createdAt: customer.createdAt.toISOString(),
      },
      statistics: {
        totalSales: salesCount,
        totalSaleAmount,
        totalDueAmount,
        totalPaidAmount,
        totalBricks,
        paymentCompletionRate: Math.round(paymentCompletionRate),
        averageSaleValue: salesCount > 0 ? totalSaleAmount / salesCount : 0,
      },
      brickTypes: brickTypesArray,
      recentSales,
      summary: {
        fullyPaidSales: customer.sales.filter((s) => s.status === "paid")
          .length,
        pendingSales: customer.sales.filter((s) => s.status === "pending")
          .length,
        partialSales: customer.sales.filter((s) => s.status === "partial")
          .length,
      },
    };

    return NextResponse.json(overviewData);
  } catch (error) {
    console.error("Customer overview fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer overview" },
      { status: 500 }
    );
  }
}
