import crypto from "node:crypto";
import { prisma } from "./prisma.js";

const sessions = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  const [salt, derivedKey] = storedHash.split(":");
  const candidateHash = crypto.scryptSync(password, salt, 64).toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(derivedKey, "hex"),
    Buffer.from(candidateHash, "hex"),
  );
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    userId: user.id,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return token;
}

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
    token: createSession(user),
    user: toClientUser(user),
  };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }

  return {
    token: createSession(user),
    user: toClientUser(user),
  };
}

export async function getUserFromToken(token) {
  if (!token) {
    return null;
  }

  const session = sessions.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    sessions.delete(token);
    return null;
  }

  return toClientUser(user);
}

export function clearSession(token) {
  if (token) {
    sessions.delete(token);
  }
}

function toClientUser(user) {
  return {
    id: user.id,
    name: user.displayName,
    email: user.email,
  };
}
