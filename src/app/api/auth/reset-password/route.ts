import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  console.log("🔄 RESET PASSWORD API CALLED");

  try {
    const body = await request.json();
    const { token, password } = body;

    console.log("🔑 Token received:", token);
    console.log("📝 Password length:", password?.length);
    console.log("⏰ Current server time:", new Date());

    if (!token || !password) {
      console.log("❌ Missing token or password");
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.log("❌ Password too short");
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // First, let's find ANY user with this token (for debugging)
    const userWithToken = await db.user.findFirst({
      where: {
        resetToken: token,
      },
    });

    console.log(
      "🔍 User found with token (any expiry):",
      userWithToken ? userWithToken.email : "No user found"
    );
    if (userWithToken) {
      console.log(
        "📅 Token expiry in database:",
        userWithToken.resetTokenExpiry
      );
      console.log(
        "⏰ Is token still valid?",
        userWithToken.resetTokenExpiry &&
          new Date() < userWithToken.resetTokenExpiry
      );
    }

    // Now find user with valid reset token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });

    console.log(
      "👤 User with valid token found:",
      user ? user.email : "No user found"
    );

    if (!user) {
      console.log("❌ Token validation failed");
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);
    console.log("🔒 Password hashed successfully");

    // Update user password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log("✅ Password reset successfully for user:", user.email);

    return NextResponse.json({
      success: true,
      message:
        "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error: any) {
    console.error("❌ Reset password error:", error);
    console.error("📝 Error details:", error.message);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Reset password route is working! Use POST to reset password.",
  });
}
