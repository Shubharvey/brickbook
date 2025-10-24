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

    const dues = await db.sale.findMany({
      where: {
        userId: decoded.id,
        OR: [{ status: "pending" }, { status: "partial" }],
      },
      include: {
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate days overdue for each due
    const duesWithDays = dues.map((due) => {
      const created = new Date(due.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...due,
        daysOverdue: diffDays,
      };
    });

    return NextResponse.json(duesWithDays);
  } catch (error: any) {
    console.error("Dues fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dues" },
      { status: 500 }
    );
  }
}
