import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "boba-secret-key-change-in-production";
const COOKIE_NAME = "boba-auth";

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create JWT token
 */
export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Get current user from cookies (server-side)
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  return verifyToken(token);
}

/**
 * Get full user data from database
 */
export async function getUserById(userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });
  
  if (!user) return null;
  
  // Don't return password hash
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Sign up a new user
 */
export async function signUp(username: string, email: string, password: string, avatarUrl?: string) {
  // Check if user exists
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });
  
  if (existing) {
    throw new Error("Email already registered");
  }
  
  const existingUsername = await db.query.users.findFirst({
    where: eq(schema.users.username, username),
  });
  
  if (existingUsername) {
    throw new Error("Username already taken");
  }
  
  // Hash password and create user
  const passwordHash = await hashPassword(password);
  
  // Default to golden boba if no avatar selected
  const finalAvatarUrl = avatarUrl || "/avatars/golden.png";
  
  const result = db.insert(schema.users).values({
    username,
    email,
    passwordHash,
    avatarUrl: finalAvatarUrl,
  }).returning();
  
  const [user] = await result;
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Sign in a user
 */
export async function signIn(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });
  
  if (!user) {
    throw new Error("Invalid email or password");
  }
  
  const valid = await verifyPassword(password, user.passwordHash);
  
  if (!valid) {
    throw new Error("Invalid email or password");
  }
  
  // Create token
  const token = createToken({
    userId: user.id,
    username: user.username,
    email: user.email,
  });
  
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
  };
}

export { COOKIE_NAME };



