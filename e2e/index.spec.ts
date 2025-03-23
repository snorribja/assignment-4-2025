import { test, expect } from "@playwright/test";

function generateRandomTodo(browser: string, testLabel: string) {
  return `TODO for ${browser} ${testLabel} ${Math.random().toString(36).substring(2, 10)}`;
}

async function countTodos(page, _browser, testLabel) {
  await page.waitForTimeout(300); // give DOM time to update
  return await page.locator("ul > li span[data-testid='todo-text']")
    .filter({ hasText: testLabel })
    .count();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");

  // Ensure app is fully loaded
  await expect(page.locator("input[type='text']")).toBeVisible();

  // Clear existing todos
  await page.evaluate(async () => {
    const res = await fetch("/api/todos");
    const todos = await res.json();
    await Promise.all(todos.map((todo: any) =>
      fetch(`/api/todos?id=${todo.id}`, { method: "DELETE" })
    ));
    await new Promise(res => setTimeout(res, 300));
  });
});

test.afterEach(async ({ page }) => {
  await page.evaluate(async () => {
    const res = await fetch("/api/todos");
    const todos = await res.json();
    await Promise.all(todos.map((todo: any) =>
      fetch(`/api/todos?id=${todo.id}`, { method: "DELETE" })
    ));
    await new Promise(res => setTimeout(res, 300));
  });
});

test("should initialize with an empty TODO list", async ({ page, browserName }, testInfo) => {
  await expect(await countTodos(page, browserName, testInfo.title)).toBe(0);
});

test("should allow adding a new TODO entry", async ({ page, browserName }, testInfo) => {
  const uniqueTodo = generateRandomTodo(browserName, testInfo.title);
  await page.fill("input[type='text']", uniqueTodo);
  await page.click("button:text('Add ✨')", { force: true });

  await expect(page.locator("span[data-testid='todo-text']").filter({ hasText: uniqueTodo }))
    .toHaveCount(1, { timeout: 5000 });

  await expect(await countTodos(page, browserName, testInfo.title)).toBe(1);
});

test("should support adding multiple TODO items", async ({ page, browserName }, testInfo) => {
  const first = generateRandomTodo(browserName, testInfo.title);
  const second = generateRandomTodo(browserName, testInfo.title);

  await page.fill("input[type='text']", first);
  await page.click("button:text('Add ✨')", { force: true });
  await page.fill("input[type='text']", second);
  await page.click("button:text('Add ✨')", { force: true });

  await expect(page.locator("span[data-testid='todo-text']").filter({ hasText: first }))
    .toHaveCount(1, { timeout: 5000 });

  await expect(page.locator("span[data-testid='todo-text']").filter({ hasText: second }))
    .toHaveCount(1, { timeout: 5000 });

  await expect(await countTodos(page, browserName, testInfo.title)).toBe(2);
});

test("should enable removing a TODO item", async ({ page, browserName }, testInfo) => {
  const todo1 = generateRandomTodo(browserName, testInfo.title);
  const todo2 = generateRandomTodo(browserName, testInfo.title);

  await page.fill("input[type='text']", todo1);
  await page.click("button:text('Add ✨')", { force: true });
  await page.fill("input[type='text']", todo2);
  await page.click("button:text('Add ✨')", { force: true });

  const target = page.locator("ul > li").filter({
    has: page.locator("span[data-testid='todo-text']", { hasText: todo1 })
  });

  await expect(target).toHaveCount(1, { timeout: 5000 });

  await target.locator("button[data-testid='delete-btn']").click({ force: true });

  await expect(page.locator("span[data-testid='todo-text']").filter({ hasText: todo1 }))
    .toHaveCount(0, { timeout: 5000 });

  await expect(page.locator("span[data-testid='todo-text']").filter({ hasText: todo2 }))
    .toHaveCount(1, { timeout: 5000 });

  await expect(await countTodos(page, browserName, testInfo.title)).toBe(1);
});

test("should confirm correct title on the index page", async ({ page }) => {
  await expect(page.title()).resolves.toMatch("TODO 📃");
});
