import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"], // You can add "query" if needed
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default async function todosHandler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case "GET": {
        const todos = await prisma.todo.findMany();
        return res.status(200).json(todos.map(todo => ({ ...todo, text: todo.title })));
      }

      case "POST": {
        const { text } = req.body;

        if (!text || typeof text !== "string" || !text.trim()) {
          return res.status(400).json({ error: "Todo text must be a non-empty string." });
        }

        const created = await prisma.todo.create({
          data: {
            title: text,
            completed: false,
          },
        });

        return res.status(201).json({ ...created, text: created.title });
      }

      case "PUT": {
        const { id } = req.query;

        if (!id || typeof id !== "string") {
          return res.status(400).json({ error: "A valid ID is required." });
        }

        const existing = await prisma.todo.findUnique({ where: { id } });

        if (!existing) {
          return res.status(404).json({ error: "Todo not found." });
        }

        const updated = await prisma.todo.update({
          where: { id },
          data: { completed: !existing.completed },
        });

        return res.status(200).json({ ...updated, text: updated.title });
      }

      case "DELETE": {
        const { id } = req.query;

        if (!id || typeof id !== "string") {
          return res.status(400).json({ error: "A valid ID must be provided." });
        }

        try {
          await prisma.todo.delete({ where: { id } });
          return res.status(200).json({ message: "Todo deleted successfully." });
        } catch (err: any) {
          if (err.code === "P2025") {
            return res.status(404).json({ error: "Todo already deleted or not found." });
          }

          console.error("Failed to delete todo:", err);
          return res.status(500).json({ error: "Unexpected error while deleting todo." });
        }
      }

      default:
        return res.status(405).json({ error: `Method ${method} not supported.` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Server error." });
  }
}
