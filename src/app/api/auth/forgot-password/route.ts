import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  console.log("🔄 FORGOT PASSWORD API CALLED");

  try {
    const body = await request.json();
    const { email } = body;

    console.log("📧 Email received:", email);

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    console.log("👤 User found:", user ? user.email : "No user found");

    if (!user) {
      // Return success even if user doesn't exist (for security)
      return NextResponse.json({
        success: true,
        message:
          "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Generate reset token (32 character hex string)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set token expiry to 1 hour from now
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    console.log("🔑 Generated reset token:", resetToken);
    console.log("⏰ Token expiry:", resetTokenExpiry);

    // Save reset token to database
    const updatedUser = await db.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    console.log(
      "✅ Reset token saved to database for user:",
      updatedUser.email
    );
    console.log("✅ Database resetToken:", updatedUser.resetToken);
    console.log("✅ Database resetTokenExpiry:", updatedUser.resetTokenExpiry);

    // For testing - return the token
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    console.log("🔗 Reset link:", resetLink);

    return NextResponse.json({
      success: true,
      message:
        "If an account with that email exists, a reset link has been sent.",
      resetToken: resetToken, // For testing
      resetLink: resetLink,
    });
  } catch (error: any) {
    console.error("❌ Error in forgot password:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Forgot password route is working! Use POST to reset password.",
  });
}
