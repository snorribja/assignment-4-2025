import { test, expect } from '@playwright/test';

test.describe('TODO List Tests', () => {

    // Ensure the app is fully loaded before each test
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        // ✅ Wait for the input field to appear before interacting
        await page.waitForSelector('[data-testid="todo-input"]', { timeout: 60000 });
    });

    test('should start with an empty TODO list', async ({ page }) => {
        const todoItems = await page.locator('.todo-item').count();
        expect(todoItems).toBe(0);
    });

    test('should add a new item to the TODO list', async ({ page }) => {
        await page.fill('[data-testid="todo-input"]', 'New Task');
        await page.click('[data-testid="add-todo-button"]');

        // ✅ Ensure the new item appears before counting
        await page.waitForSelector('.todo-item');
        const todoItems = await page.locator('.todo-item').count();
        expect(todoItems).toBe(1);
    });

    test('should allow adding a second item to the TODO list', async ({ page }) => {
        await page.fill('[data-testid="todo-input"]', 'Second Task');
        await page.click('[data-testid="add-todo-button"]');

        // ✅ Wait for the second item before counting
        await page.waitForSelector('.todo-item:nth-of-type(2)');
        const todoItems = await page.locator('.todo-item').count();
        expect(todoItems).toBe(2);
    });

    test('should remove an item from the TODO list', async ({ page }) => {
        // ✅ Ensure there's at least one item before attempting to delete
        await page.waitForSelector('.todo-item');

        await page.click('[data-testid="delete-button-0"]'); // Assuming first item's delete button

        // ✅ Wait for the item count to reduce
        await page.waitForTimeout(1000); // Allow UI to update
        const todoItems = await page.locator('.todo-item').count();
        expect(todoItems).toBe(1); // Assuming one item remains
    });

});

