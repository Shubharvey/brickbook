import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
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

    // Get customers with their sales to calculate due amounts
    const customers = await db.customer.findMany({
      where: { userId: decoded.id },
      include: {
        sales: {
          select: {
            totalAmount: true,
            paidAmount: true,
            dueAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate total due amount for each customer
    const customersWithDues = customers.map((customer) => {
      // Calculate total due from all sales
      const totalDueAmount = customer.sales.reduce((sum, sale) => {
        return sum + sale.dueAmount;
      }, 0);

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        createdAt: customer.createdAt,
        advanceBalance: customer.advanceBalance,
        dueAmount: totalDueAmount, // ✅ Now this will be calculated
        lastPurchaseDate: customer.lastPurchaseDate,
      };
    });

    return NextResponse.json(customersWithDues);
  } catch (error: any) {
    console.error("Customers fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, phone, email, address } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate customer
    const existingCustomer = await db.customer.findFirst({
      where: {
        userId: decoded.id,
        OR: [
          { name: { equals: name, mode: "insensitive" as const } },
          ...(phone ? [{ phone }] : []),
          ...(email
            ? [{ email: { equals: email, mode: "insensitive" as const } }]
            : []),
        ],
      },
    });

    if (existingCustomer) {
      let duplicateField = "name";
      if (phone && existingCustomer.phone === phone) {
        duplicateField = "phone number";
      } else if (
        email &&
        existingCustomer.email?.toLowerCase() === email.toLowerCase()
      ) {
        duplicateField = "email";
      }

      return NextResponse.json(
        { error: `Customer with this ${duplicateField} already exists` },
        { status: 409 }
      );
    }

    const customer = await db.customer.create({
      data: {
        name,
        phone,
        email,
        address,
        userId: decoded.id,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("Customer creation error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
