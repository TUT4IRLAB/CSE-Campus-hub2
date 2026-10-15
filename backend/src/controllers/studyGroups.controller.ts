import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";

async function serializeGroup(groupId: string, userId?: string) {
  const group = await prisma.studyGroup.findUniqueOrThrow({
    where: { id: groupId },
    include: { owner: true, members: true },
  });
  return {
    id: group.id,
    name: group.name,
    module: group.module,
    moduleCode: group.moduleCode,
    date: group.date,
    time: group.time,
    location: group.location,
    members: group.members.length,
    maxMembers: group.maxMembers,
    topics: group.topics,
    owner: group.owner.name,
    ownerEmail: group.owner.email,
    joined: userId ? group.members.some((m) => m.userId === userId) : false,
    isOwner: userId ? group.ownerId === userId : false,
  };
}

export async function listGroups(req: Request, res: Response) {
  const groups = await prisma.studyGroup.findMany({ orderBy: { createdAt: "desc" } });
  const serialized = await Promise.all(groups.map((g) => serializeGroup(g.id, req.user?.userId)));
  return res.json(serialized);
}

export async function getGroup(req: Request, res: Response) {
  const serialized = await serializeGroup(req.params.id, req.user?.userId);
  return res.json(serialized);
}

const createGroupSchema = z.object({
  name: z.string().min(1),
  module: z.string().min(1),
  moduleCode: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(1),
  maxMembers: z.coerce.number().int().min(2).max(50).default(8),
  topics: z.array(z.string()).default([]),
});

export async function createGroup(req: Request, res: Response) {
  const data = createGroupSchema.parse(req.body);
  const group = await prisma.studyGroup.create({
    data: { ...data, ownerId: req.user!.userId },
  });
  // Owner automatically joins their own group.
  await prisma.studyGroupMember.create({
    data: { groupId: group.id, userId: req.user!.userId },
  });
  const serialized = await serializeGroup(group.id, req.user!.userId);
  return res.status(201).json(serialized);
}

export async function joinGroup(req: Request, res: Response) {
  const group = await prisma.studyGroup.findUnique({
    where: { id: req.params.id },
    include: { members: true },
  });
  if (!group) throw new ApiError(404, "Study group not found");
  if (group.members.length >= group.maxMembers) throw new ApiError(400, "This group is full");

  await prisma.studyGroupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: req.user!.userId } },
    update: {},
    create: { groupId: group.id, userId: req.user!.userId },
  });
  const serialized = await serializeGroup(group.id, req.user!.userId);
  return res.json(serialized);
}

export async function leaveGroup(req: Request, res: Response) {
  await prisma.studyGroupMember.deleteMany({
    where: { groupId: req.params.id, userId: req.user!.userId },
  });
  const serialized = await serializeGroup(req.params.id, req.user!.userId);
  return res.json(serialized);
}

export async function myGroups(req: Request, res: Response) {
  const memberships = await prisma.studyGroupMember.findMany({
    where: { userId: req.user!.userId },
    select: { groupId: true },
  });
  const serialized = await Promise.all(memberships.map((m) => serializeGroup(m.groupId, req.user!.userId)));
  return res.json(serialized);
}

export async function deleteGroup(req: Request, res: Response) {
  const group = await prisma.studyGroup.findUnique({ where: { id: req.params.id } });
  if (!group) throw new ApiError(404, "Study group not found");
  if (group.ownerId !== req.user!.userId) throw new ApiError(403, "You can only delete groups you created");
  // Memberships are removed automatically (onDelete: Cascade).
  await prisma.studyGroup.delete({ where: { id: group.id } });
  return res.status(204).send();
}
