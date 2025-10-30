import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    const result = await db.$queryRaw`SELECT 1 as test`;
    console.log("Database connection test:", result);

    // Test if we can query sales
    const salesCount = await db.sale.count();
    console.log("Total sales in database:", salesCount);

    // Test if we can query customers
    const customersCount = await db.customer.count();
    console.log("Total customers in database:", customersCount);

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      salesCount,
      customersCount,
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
