import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/errorHandler";

function serialize(book: Awaited<ReturnType<typeof prisma.textbook.findFirstOrThrow>> & {
  seller: { name: string; email: string };
}, userId?: string) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    module: book.module,
    moduleCode: book.moduleCode,
    price: Number(book.price),
    condition: book.condition.charAt(0) + book.condition.slice(1).toLowerCase(),
    seller: book.seller.name,
    sellerEmail: book.seller.email,
    image: book.image,
    description: book.description,
    year: book.year,
    isbn: book.isbn ?? undefined,
    available: book.available,
    mine: userId ? book.sellerId === userId : false,
  };
}

export async function listBooks(req: Request, res: Response) {
  const books = await prisma.textbook.findMany({
    include: { seller: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json(books.map((b) => serialize(b, req.user?.userId)));
}

export async function getBook(req: Request, res: Response) {
  const book = await prisma.textbook.findUnique({
    where: { id: req.params.id },
    include: { seller: true },
  });
  if (!book) throw new ApiError(404, "Textbook not found");
  return res.json(serialize(book, req.user?.userId));
}

export async function myListings(req: Request, res: Response) {
  const books = await prisma.textbook.findMany({
    where: { sellerId: req.user!.userId },
    include: { seller: true },
    orderBy: { createdAt: "desc" },
  });
  return res.json(books.map((b) => serialize(b, req.user?.userId)));
}

const sellSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  module: z.string().min(1),
  moduleCode: z.string().min(1),
  price: z.coerce.number().positive(),
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR"]),
  image: z.string().url(),
  description: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(2100),
  isbn: z.string().optional(),
});

export async function createListing(req: Request, res: Response) {
  const data = sellSchema.parse(req.body);
  const book = await prisma.textbook.create({
    data: { ...data, sellerId: req.user!.userId, available: true },
    include: { seller: true },
  });
  return res.status(201).json(serialize(book, req.user?.userId));
}

export async function deleteListing(req: Request, res: Response) {
  const book = await prisma.textbook.findUnique({ where: { id: req.params.id } });
  if (!book) throw new ApiError(404, "Textbook not found");
  if (book.sellerId !== req.user!.userId) throw new ApiError(403, "You don't own this listing");
  await prisma.textbook.delete({ where: { id: req.params.id } });
  return res.status(204).send();
}
