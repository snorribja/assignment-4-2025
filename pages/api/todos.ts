import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, Todo } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

type TodoResponse = Todo & { text: string };

export default async function todosHandler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case "GET": {
      const todos = await prisma.todo.findMany();
      const formatted: TodoResponse[] = todos.map((todo) => ({
        ...todo,
        text: todo.title,
      }));
      return res.status(200).json(formatted);
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

      const response: TodoResponse = { ...created, text: created.title };
      return res.status(201).json(response);
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

      const response: TodoResponse = { ...updated, text: updated.title };
      return res.status(200).json(response);
    }

    case "DELETE": {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "A valid ID must be provided." });
      }

      try {
        await prisma.todo.delete({ where: { id } });
        return res.status(200).json({ message: "Todo deleted successfully." });
      } catch (err: unknown) {
        const error = err as { code?: string };

        if (error.code === "P2025") {
          return res.status(404).json({ error: "Todo already deleted or not found." });
        }

        console.error("Failed to delete todo:", error);
        return res.status(500).json({ error: "Unexpected error while deleting todo." });
      }
    }

    default:
      return res.status(405).json({ error: `Method ${method} not supported.` });
  }
}
