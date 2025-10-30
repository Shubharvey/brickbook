import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    console.log("Testing database connection...");

    // Test 1: Simple raw query
    const result = await db.$queryRaw`SELECT 1 as test_value`;
    console.log("Raw query test passed");

    // Test 2: Count records
    const userCount = await db.user.count();
    const saleCount = await db.sale.count();
    const customerCount = await db.customer.count();

    console.log(
      "Counts - Users:",
      userCount,
      "Sales:",
      saleCount,
      "Customers:",
      customerCount
    );

    return NextResponse.json({
      success: true,
      message: "Database connection successful! 🎉",
      counts: {
        users: userCount,
        sales: saleCount,
        customers: customerCount,
      },
      test: result,
    });
  } catch (error) {
    console.error("❌ Database test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Database test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: 500 }
    );
  }
}
