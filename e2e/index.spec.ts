import { test, expect } from "@playwright/test";


function createUniqueTodo(browser: string, label: string): string {
  return `Task for ${browser} ${label} ${Math.random().toString(36).slice(2, 10)}`;
}

async function getTodoCount(page, _browser, label) {
  await page.waitForTimeout(500);
  return await page.locator("ul > li span[data-testid='todo-text']")
    .filter({ hasText: label })
    .count();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");

  await page.evaluate(async () => {
    const res = await fetch(`/api/todos`);
    const items = await res.json();
    await Promise.all(
      items.map((item: any) =>
        fetch(`/api/todos?id=${item.id}`, { method: "DELETE" })
      )
    );
    await new Promise((done) => setTimeout(done, 500));
  });
});



test.afterEach(async ({ page }) => {
  await page.evaluate(async () => {
    const res = await fetch(`/api/todos`);
    const items = await res.json();
    await Promise.all(
      items.map((item: { id: string }) =>
        fetch(`/api/todos?id=${item.id}`, { method: "DELETE" })
      )
    );
    await new Promise((done) => setTimeout(done, 300));
  });
});

test("initial state should have zero TODOs", async ({ page, browserName }, testInfo) => {
  const total = await getTodoCount(page, browserName, testInfo.title);
  expect(total).toBe(0);
});


test("can add a single new TODO", async ({ page, browserName }, testInfo) => {
  const todoText = createUniqueTodo(browserName, testInfo.title);
  await page.locator("input[type='text']").fill(todoText);
  await page.getByText("Add ✨", { exact: true }).click({ force: true });

  await expect(
    page.locator("ul > li span").filter({ hasText: todoText })
  ).toHaveCount(1);

  const total = await getTodoCount(page, browserName, testInfo.title);
  expect(total).toBe(1);
});

test("supports adding several TODO entries", async ({ page, browserName }, testInfo) => {
  const taskA = createUniqueTodo(browserName, testInfo.title);
  const taskB = createUniqueTodo(browserName, testInfo.title);

  await page.fill("input[type='text']", taskA);
  await page.click("button:text('Add ✨')", { force: true });
  await page.fill("input[type='text']", taskB);
  await page.click("button:text('Add ✨')", { force: true });

  await expect(page.locator("ul > li span").filter({ hasText: taskA })).toHaveCount(1);
  await expect(page.locator("ul > li span").filter({ hasText: taskB })).toHaveCount(1);

  const count = await getTodoCount(page, browserName, testInfo.title);
  expect(count).toBe(2);
});

test("allows deletion of an individual TODO", async ({ page, browserName }, testInfo) => {
  const todo1 = createUniqueTodo(browserName, testInfo.title);
  const todo2 = createUniqueTodo(browserName, testInfo.title);

  await page.fill("input[type='text']", todo1);
  await page.click("button:text('Add ✨')", { force: true });
  await page.fill("input[type='text']", todo2);
  await page.click("button:text('Add ✨')", { force: true });

  await expect(page.locator("span[data-testid='todo-text']").filter({ hasText: todo1 })).toHaveCount(1);
  await expect(page.locator("span[data-testid='todo-text']").filter({ hasText: todo2 })).toHaveCount(1);

  const targetItem = page.locator("ul > li").filter({
    has: page.locator("span[data-testid='todo-text']", { hasText: todo1 })
  }).first();

  await targetItem.locator("button[data-testid='delete-btn']").click({ force: true });

  await expect(page.locator("span[data-testid='todo-text']").filter({ hasText: todo1 })).toHaveCount(0);
  await expect(page.locator("span[data-testid='todo-text']").filter({ hasText: todo2 })).toHaveCount(1);

  const remaining = await getTodoCount(page, browserName, testInfo.title);
  expect(remaining).toBe(1);
});

test("should have correct document title", async ({ page }) => {
  await expect(page.title()).resolves.toContain("TODO 📃");
});
