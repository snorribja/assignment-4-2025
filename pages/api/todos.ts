import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function todosHandler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET": {
      const todoList = await prisma.todo.findMany();
      const formattedTodos = todoList.map((item) => ({
        ...item,
        text: item.title,
      }));
      return res.status(200).json(formattedTodos);
    }

    case "POST": {
      const { text } = req.body;

      if (!text || typeof text !== "string" || text.trim() === "") {
        return res.status(400).json({ error: "A non-empty text string is required." });
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
      const id = req.query.id;
      if (typeof id !== "string") {
        return res.status(400).json({ error: "ID must be a valid string." });
      }

      const existing = await prisma.todo.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "Todo item not found." });
      }

      const toggled = await prisma.todo.update({
        where: { id },
        data: { completed: !existing.completed },
      });

      return res.status(200).json({ ...toggled, text: toggled.title });
    }

    case "DELETE": {
      const id = req.query.id;
      if (typeof id !== "string") {
        return res.status(400).json({ error: "A valid ID is required." });
      }

      try {
        await prisma.todo.delete({ where: { id } });
        return res.status(200).json({ message: "Todo successfully removed." });
      } catch (err) {
        console.error("Failed to delete todo:", err);
        return res.status(500).json({ error: "An error occurred during deletion." });
      }
    }

    default:
      return res.status(405).json({ error: "HTTP method not supported." });
  }
}
