import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { ApiError } from "../middleware/errorHandler";

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  studentNumber: z.string().min(1),
  phone: z.string().min(7).max(20).optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      passwordHash,
      studentNumber: data.studentNumber,
      phone: data.phone,
      role: "STUDENT",
    },
  });

  return res.status(201).json({ id: user.id, name: user.name, email: user.email });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new ApiError(401, "Invalid email or password");

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid email or password");

  const token = signToken({ userId: user.id, role: user.role });
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentNumber: user.studentNumber,
      phone: user.phone,
    },
  });
}

const forgotSchema = z.object({ email: z.string().email() });

export async function forgotPassword(req: Request, res: Response) {
  const data = forgotSchema.parse(req.body);
  // Always respond 200 regardless of whether the account exists, to avoid
  // leaking which emails are registered. Wire up real email delivery
  // (Resend/SendGrid) here when ready; for now this is a stub.
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (user) {
    // TODO: generate a reset token, store its hash + expiry, and email a reset link.
  }
  return res.json({ message: "If that email is registered, a reset link has been sent." });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.userId } });
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    studentNumber: user.studentNumber,
    phone: user.phone,
  });
}
