import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";

type Person = { id: string; name: string; email: string; phone: string | null };
const person = (u: Person | null | undefined) =>
  u ? { id: u.id, name: u.name, email: u.email, phone: u.phone } : null;

// Everything the admin page needs in one call: every post, with who posted it.
export async function overview(_req: Request, res: Response) {
  const [users, groups, items, books, events] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { studyGroupsOwned: true, lostItemsReported: true, textbooksListed: true, eventsCreated: true } },
      },
    }),
    prisma.studyGroup.findMany({
      orderBy: { createdAt: "desc" },
      include: { owner: true, _count: { select: { members: true } } },
    }),
    prisma.lostItem.findMany({
      orderBy: { createdAt: "desc" },
      include: { reportedBy: true, handledBy: true },
    }),
    prisma.textbook.findMany({ orderBy: { createdAt: "desc" }, include: { seller: true } }),
    prisma.campusEvent.findMany({
      orderBy: { createdAt: "desc" },
      include: { createdBy: true, _count: { select: { registrations: true } } },
    }),
  ]);

  return res.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      studentNumber: u.studentNumber,
      createdAt: u.createdAt,
      counts: {
        studyGroups: u._count.studyGroupsOwned,
        lostItems: u._count.lostItemsReported,
        textbooks: u._count.textbooksListed,
        events: u._count.eventsCreated,
      },
    })),
    studyGroups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      moduleCode: g.moduleCode,
      date: g.date,
      time: g.time,
      location: g.location,
      members: g._count.members,
      maxMembers: g.maxMembers,
      postedBy: person(g.owner),
      createdAt: g.createdAt,
    })),
    lostItems: items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      location: i.location,
      dateLost: i.dateLost.toISOString().slice(0, 10),
      status: i.status.charAt(0) + i.status.slice(1).toLowerCase(),
      postedBy: person(i.reportedBy),
      handledBy: i.handledBy?.name ?? null,
      createdAt: i.createdAt,
    })),
    textbooks: books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      moduleCode: b.moduleCode,
      price: Number(b.price),
      condition: b.condition.charAt(0) + b.condition.slice(1).toLowerCase(),
      available: b.available,
      postedBy: person(b.seller),
      createdAt: b.createdAt,
    })),
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      date: e.date,
      time: e.time,
      location: e.location,
      attendees: e._count.registrations,
      capacity: e.capacity,
      postedBy: person(e.createdBy), // null = official / seeded event
      createdAt: e.createdAt,
    })),
  });
}

// Admins can delete any post. Related rows (members, registrations) cascade.
const deleters: Record<string, (id: string) => Promise<unknown>> = {
  "study-groups": (id) => prisma.studyGroup.delete({ where: { id } }),
  "lost-items": (id) => prisma.lostItem.delete({ where: { id } }),
  textbooks: (id) => prisma.textbook.delete({ where: { id } }),
  events: (id) => prisma.campusEvent.delete({ where: { id } }),
};

export async function deletePost(req: Request, res: Response) {
  const deleter = deleters[req.params.type];
  if (!deleter) throw new ApiError(404, "Unknown post type");
  try {
    await deleter(req.params.id);
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") throw new ApiError(404, "Post not found");
    throw err;
  }
  return res.status(204).send();
}
