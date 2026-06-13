import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { parse as parseCookie, serialize as serializeCookie } from "cookie";
import { AUTH_COOKIE_NAME, JWT_SESSION_TTL_SECONDS } from "@live-collab/shared";
import { prisma } from "./prisma.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-change-me";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Hashes a plaintext password using scrypt with a random salt.
 * Formats the output as `salt:hash`.
 */
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

/**
 * Verifies a plaintext password against a stored `salt:hash` string
 * using a constant-time comparison to prevent timing attacks.
 */
function verifyPassword(password, storedHash) {
  const [salt, derivedKey] = storedHash.split(":");
  const candidateHash = crypto.scryptSync(password, salt, 64).toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(derivedKey, "hex"),
    Buffer.from(candidateHash, "hex"),
  );
}

function toClientUser(user) {
  return {
    id: user.id,
    name: user.displayName,
    email: user.email,
  };
}

/**
 * Generates a signed JWT session token for the authenticated user.
 */
function signSessionToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.displayName,
    },
    JWT_SECRET,
    { expiresIn: JWT_SESSION_TTL_SECONDS },
  );
}

export function createSessionCookie(token) {
  return serializeCookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/",
    maxAge: JWT_SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie() {
  return serializeCookie(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/",
    maxAge: 0,
  });
}

/**
 * Parses the raw cookie header to extract the JWT token.
 */
export function getTokenFromCookies(cookieHeader = "") {
  const cookies = parseCookie(cookieHeader || "");
  return cookies[AUTH_COOKIE_NAME] ?? null;
}

/**
 * Validates a JWT token and retrieves the corresponding database user record.
 */
export async function getUserFromToken(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload?.sub) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    return user ? toClientUser(user) : null;
  } catch {
    return null;
  }
}

/**
 * Helper to extract and validate the user from an incoming Express/HTTP request.
 * Checks both cookies and the Authorization header.
 */
export async function getUserFromRequest(request) {
  let token = getTokenFromCookies(request.headers.cookie ?? "");
  if (!token && request.headers.authorization?.startsWith("Bearer ")) {
    token = request.headers.authorization.substring(7);
  }
  return getUserFromToken(token);
}

/**
 * Handles user registration.
 */
export async function signupUser({ displayName, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      displayName: displayName.trim(),
      passwordHash: hashPassword(password),
    },
  });

  return {
    token: signSessionToken(user),
    user: toClientUser(user),
  };
}

/**
 * Handles user login and password verification.
 */
export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }

  return {
    token: signSessionToken(user),
    user: toClientUser(user),
  };
}
