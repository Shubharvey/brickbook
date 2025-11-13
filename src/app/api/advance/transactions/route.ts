import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("🟢 Advance Transactions API called");

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No auth header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log("❌ Invalid token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    console.log("🔍 Fetching transactions for:", {
      customerId,
      userId: decoded.id,
    });

    // Build where clause
    const whereClause: any = {
      userId: decoded.id,
    };

    if (customerId) {
      whereClause.customerId = customerId;
    }

    console.log("📊 Where clause:", whereClause);

    // Fetch advance transactions with customer and sale information
    const transactions = await db.advancePayment.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        sale: {
          select: {
            id: true,
            invoiceNo: true,
          },
        },
      },
      orderBy: {
        date: "desc", // Sort by date descending (newest first)
      },
    });

    console.log(`✅ Found ${transactions.length} transactions`);

    // Transform the data to match the expected format
    const transformedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type as
        | "ADVANCE_ADDED"
        | "ADVANCE_PAYMENT"
        | "ADVANCE_USED",
      description: transaction.description,
      reference: transaction.reference,
      saleId: transaction.saleId,
      // ✅ IMPORTANT: Use the date field from the database, fallback to createdAt
      date: transaction.date
        ? transaction.date.toISOString()
        : transaction.createdAt.toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      sale: transaction.sale
        ? {
            invoiceNo: transaction.sale.invoiceNo,
          }
        : undefined,
      customer: transaction.customer,
    }));

    console.log("📦 Transformed transactions:", transformedTransactions.length);

    return NextResponse.json({
      success: true,
      transactions: transformedTransactions,
      count: transformedTransactions.length,
    });
  } catch (error: any) {
    console.error("❌ Advance transactions fetch error:", error);
    console.error("📝 Error details:", error.message);
    console.error("🔧 Error stack:", error.stack);

    return NextResponse.json(
      {
        error: "Failed to fetch advance transactions",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// POST: Create a new advance transaction (if needed)
export async function POST(request: NextRequest) {
  try {
    console.log("🟢 Advance Transactions POST called");

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
    console.log("📦 Request body:", body);

    const { customerId, amount, type, description, reference, date } = body;

    // Validation
    if (!customerId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Customer ID and valid amount are required" },
        { status: 400 }
      );
    }

    // Validate and parse date
    let transactionDate;
    if (date) {
      transactionDate = new Date(date);
      if (isNaN(transactionDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }
    } else {
      transactionDate = new Date(); // Default to current date
    }

    // Verify customer exists and belongs to user
    const customer = await db.customer.findFirst({
      where: {
        id: customerId,
        userId: decoded.id,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Create the advance transaction
    const advanceTransaction = await db.advancePayment.create({
      data: {
        customerId,
        userId: decoded.id,
        amount,
        type: type || "ADVANCE_ADDED",
        description: description || "Advance transaction",
        reference: reference || null,
        date: transactionDate, // ✅ Store the provided date
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        sale: {
          select: {
            id: true,
            invoiceNo: true,
          },
        },
      },
    });

    // Update customer's advance balance based on transaction type
    let newAdvanceBalance = customer.advanceBalance;
    if (type === "ADVANCE_ADDED" || type === "ADVANCE_PAYMENT") {
      newAdvanceBalance += amount;
    } else if (type === "ADVANCE_USED") {
      newAdvanceBalance -= amount;
    }

    await db.customer.update({
      where: { id: customerId },
      data: {
        advanceBalance: newAdvanceBalance,
        lastPurchaseDate: new Date(),
      },
    });

    // Transform the response
    const transformedTransaction = {
      id: advanceTransaction.id,
      amount: advanceTransaction.amount,
      type: advanceTransaction.type as
        | "ADVANCE_ADDED"
        | "ADVANCE_PAYMENT"
        | "ADVANCE_USED",
      description: advanceTransaction.description,
      reference: advanceTransaction.reference,
      saleId: advanceTransaction.saleId,
      date: advanceTransaction.date
        ? advanceTransaction.date.toISOString()
        : advanceTransaction.createdAt.toISOString(),
      createdAt: advanceTransaction.createdAt.toISOString(),
      sale: advanceTransaction.sale
        ? {
            invoiceNo: advanceTransaction.sale.invoiceNo,
          }
        : undefined,
      customer: advanceTransaction.customer,
    };

    return NextResponse.json({
      success: true,
      transaction: transformedTransaction,
      message: "Advance transaction created successfully",
    });
  } catch (error: any) {
    console.error("❌ Advance transaction creation error:", error);
    return NextResponse.json(
      { error: "Failed to create advance transaction", details: error.message },
      { status: 500 }
    );
  }
}
