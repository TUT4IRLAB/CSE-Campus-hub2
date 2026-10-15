import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";

function serialize(item: Awaited<ReturnType<typeof prisma.lostItem.findFirstOrThrow>> & {
  reportedBy: { name: string };
}) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    location: item.location,
    dateLost: item.dateLost.toISOString().slice(0, 10),
    status: item.status.charAt(0) + item.status.slice(1).toLowerCase(), // LOST -> "Lost"
    reportedBy: item.reportedBy.name,
    category: item.category,
    image: item.image ?? undefined,
  };
}

export async function listItems(req: Request, res: Response) {
  const { status } = req.query;
  const items = await prisma.lostItem.findMany({
    where: status && status !== "All" ? { status: String(status).toUpperCase() as any } : undefined,
    include: { reportedBy: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json(items.map(serialize));
}

export async function myReports(req: Request, res: Response) {
  const items = await prisma.lostItem.findMany({
    where: { reportedById: req.user!.userId },
    include: { reportedBy: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json(items.map(serialize));
}

const reportSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  dateLost: z.string().min(1), // ISO date string
  category: z.string().min(1),
  image: z.string().url().optional(),
});

export async function reportItem(req: Request, res: Response) {
  const data = reportSchema.parse(req.body);
  const item = await prisma.lostItem.create({
    data: {
      ...data,
      dateLost: new Date(data.dateLost),
      status: "LOST",
      reportedById: req.user!.userId,
    },
    include: { reportedBy: true },
  });
  return res.status(201).json(serialize(item));
}

const updateStatusSchema = z.object({
  status: z.enum(["LOST", "FOUND", "RETURNED"]),
});

// Security-guard-only: mark an item as found or returned.
export async function updateItemStatus(req: Request, res: Response) {
  const data = updateStatusSchema.parse(req.body);
  const existing = await prisma.lostItem.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Item not found");

  const item = await prisma.lostItem.update({
    where: { id: req.params.id },
    data: { status: data.status, handledById: req.user!.userId },
    include: { reportedBy: true },
  });
  return res.json(serialize(item));
}

// Security-guard-only: permanently delete a record.
export async function deleteItem(req: Request, res: Response) {
  const existing = await prisma.lostItem.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Item not found");
  await prisma.lostItem.delete({ where: { id: req.params.id } });
  return res.status(204).send();
}
