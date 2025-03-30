import '../../config/tracing';

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { dogstatsd } from '../../config/tracing';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    dogstatsd.increment('api.todos.get.requests');
    dogstatsd.increment('api.todos.requests');
    try {
      const todos = await prisma.todo.findMany();
      const mappedTodos = todos.map((todo: { title: string }) => ({
        ...todo,
        text: todo.title as string,
      }));
      dogstatsd.increment('api.todos.get.success');
      return res.status(200).json(mappedTodos);
    } catch (error: unknown) {
      dogstatsd.increment('api.todos.get.error');
      console.error("Error getting todos:", error);
      return res.status(500).json({ error: "Failed to get todos" });
    }
  }

  if (req.method === "POST") {
    dogstatsd.increment('api.todos.post.requests');
    dogstatsd.increment('api.todos.requests');
    const { text } = req.body;

    if (typeof text !== "string" || text.trim().length === 0) {
      dogstatsd.increment('api.todos.post.error');
      return res.status(400).json({ error: "Text is required and must be a string" });
    }

    try {
      const newTodo = await prisma.todo.create({
        data: {
          title: text,
          completed: false,
        },
      });
      dogstatsd.increment('api.todos.post.success');
      return res.status(201).json({ ...newTodo, text: newTodo.title });
    } catch (error: unknown) {
      dogstatsd.increment('api.todos.post.error');
      console.error("Error creating todo:", error);
      return res.status(500).json({ error: "Failed to create todo" });
    }
  }

  if (req.method === "PUT") {
    dogstatsd.increment('api.todos.put.requests');
    dogstatsd.increment('api.todos.requests');
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      dogstatsd.increment('api.todos.put.error');
      return res.status(400).json({ error: "Invalid ID" });
    }

    try {
      const todo = await prisma.todo.findUnique({ where: { id } });
      if (!todo) {
        dogstatsd.increment('api.todos.put.notfound');
        return res.status(404).json({ error: "Todo not found" });
      }

      const updatedTodo = await prisma.todo.update({
        where: { id },
        data: { completed: !todo.completed },
      });
      dogstatsd.increment('api.todos.put.success');
      return res.status(200).json({ ...updatedTodo, text: updatedTodo.title });
    } catch (error: unknown) {
      dogstatsd.increment('api.todos.put.error');
      console.error("Error updating todo:", error);
      return res.status(500).json({ error: "Failed to update todo" });
    }
  }

  if (req.method === "DELETE") {
    dogstatsd.increment('api.todos.delete.requests');
    dogstatsd.increment('api.todos.requests');
    const { id } = req.query;
    if (!id || typeof id !== "string") {
      dogstatsd.increment('api.todos.delete.error');
      return res.status(400).json({ error: "Invalid ID" });
    }

    try {
      await prisma.todo.delete({ where: { id } });
      dogstatsd.increment('api.todos.delete.success');
      return res.status(200).json({ message: "Todo deleted successfully" });
    } catch (error: unknown) {
      dogstatsd.increment('api.todos.delete.error');
      console.error("Error deleting todo:", error);
      return res.status(500).json({ error: "Failed to delete todo" });
    }
  }

  dogstatsd.increment('api.todos.methodnotallowed');
  return res.status(405).json({ error: "Method Not Allowed" });
}