import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";

async function serializeEvent(eventId: string, userId?: string) {
  const event = await prisma.campusEvent.findUniqueOrThrow({
    where: { id: eventId },
    include: { registrations: true },
  });
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.location,
    category: event.category,
    description: event.description,
    organiser: event.organiser,
    capacity: event.capacity,
    attendees: event.registrations.length,
    image: event.image,
    registered: userId ? event.registrations.some((r) => r.userId === userId) : false,
    mine: userId ? event.createdById === userId : false,
  };
}

export async function listEvents(req: Request, res: Response) {
  const events = await prisma.campusEvent.findMany({ orderBy: { createdAt: "asc" } });
  const serialized = await Promise.all(events.map((e) => serializeEvent(e.id, req.user?.userId)));
  return res.json(serialized);
}

export async function getEvent(req: Request, res: Response) {
  const serialized = await serializeEvent(req.params.id, req.user?.userId);
  return res.json(serialized);
}

export async function registerForEvent(req: Request, res: Response) {
  const event = await prisma.campusEvent.findUnique({
    where: { id: req.params.id },
    include: { registrations: true },
  });
  if (!event) throw new ApiError(404, "Event not found");
  if (event.registrations.length >= event.capacity) throw new ApiError(400, "This event is at capacity");

  await prisma.eventRegistration.upsert({
    where: { eventId_userId: { eventId: event.id, userId: req.user!.userId } },
    update: {},
    create: { eventId: event.id, userId: req.user!.userId },
  });
  const serialized = await serializeEvent(event.id, req.user!.userId);
  return res.json(serialized);
}

export async function unregisterFromEvent(req: Request, res: Response) {
  await prisma.eventRegistration.deleteMany({
    where: { eventId: req.params.id, userId: req.user!.userId },
  });
  const serialized = await serializeEvent(req.params.id, req.user!.userId);
  return res.json(serialized);
}

export async function myEvents(req: Request, res: Response) {
  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: req.user!.userId },
    select: { eventId: true },
  });
  const serialized = await Promise.all(registrations.map((r) => serializeEvent(r.eventId, req.user!.userId)));
  return res.json(serialized);
}

const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=300&fit=crop&auto=format";

const createEventSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  organiser: z.string().min(1).optional(),
  capacity: z.coerce.number().int().min(1).max(100000),
  image: z.string().url().optional(),
});

export async function createEvent(req: Request, res: Response) {
  const data = createEventSchema.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.userId } });
  const event = await prisma.campusEvent.create({
    data: {
      ...data,
      organiser: data.organiser ?? user.name,
      image: data.image ?? DEFAULT_EVENT_IMAGE,
      createdById: user.id,
    },
  });
  const serialized = await serializeEvent(event.id, req.user!.userId);
  return res.status(201).json(serialized);
}

export async function deleteEvent(req: Request, res: Response) {
  const event = await prisma.campusEvent.findUnique({ where: { id: req.params.id } });
  if (!event) throw new ApiError(404, "Event not found");
  if (event.createdById !== req.user!.userId) throw new ApiError(403, "You can only delete events you created");
  // Registrations are removed automatically (onDelete: Cascade).
  await prisma.campusEvent.delete({ where: { id: event.id } });
  return res.status(204).send();
}
