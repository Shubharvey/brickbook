import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  company?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  company?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function registerUser(
  data: RegisterData
): Promise<{ user: User; token: string }> {
  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await db.user.create({
    data: {
      email: data.email,
      name: data.name,
      phone: data.phone,
      company: data.company,
      password: hashedPassword,
    },
  });

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    company: user.company,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      company: user.company,
    },
    token,
  };
}

export async function loginUser(
  credentials: LoginCredentials
): Promise<{ user: User; token: string }> {
  // Find user
  const user = await db.user.findUnique({
    where: { email: credentials.email },
  });

  if (!user || !user.password) {
    throw new Error("Invalid credentials");
  }

  // Verify password
  const isValid = await verifyPassword(credentials.password, user.password);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    company: user.company,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      company: user.company,
    },
    token,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      company: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    company: user.company,
  };
}
