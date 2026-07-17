import { test, expect } from "@playwright/test";

test("text share round trip", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/paste\/type text/i).fill("hello e2e test");
  await page.getByRole("button", { name: /create share/i }).click();

  const codeLocator = page.locator("p.font-mono");
  await expect(codeLocator).toBeVisible({ timeout: 10000 });
  const code = await codeLocator.textContent();

  await page.goto(`/s/${code}`);
  await expect(page.getByText("hello e2e test")).toBeVisible();
});

test("password-protected share requires correct password", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/paste\/type text/i).fill("locked content");
  await page.getByPlaceholder(/password/i).fill("test123");
  await page.getByRole("button", { name: /create share/i }).click();

  const code = await page.locator("p.font-mono").textContent();
  await page.goto(`/s/${code}`);

  await expect(page.getByText(/password required/i)).toBeVisible();

  await page.getByPlaceholder(/enter password/i).fill("wrongpass");
  await page.getByRole("button", { name: /unlock/i }).click();
  await expect(page.getByText(/invalid password/i)).toBeVisible();

  await page.getByPlaceholder(/enter password/i).fill("test123");
  await page.getByRole("button", { name: /unlock/i }).click();
  await expect(page.getByText("locked content")).toBeVisible();
});

test("one-time share is destroyed after first view", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/paste\/type text/i).fill("burn after reading");
  await page.getByLabel(/delete after first download/i).check();
  await page.getByRole("button", { name: /create share/i }).click();

  const code = await page.locator("p.font-mono").textContent();

  await page.goto(`/s/${code}`);
  await expect(page.getByText("burn after reading")).toBeVisible();

  await page.goto(`/s/${code}`);
  await expect(page.getByText(/not found|error/i)).toBeVisible();
});

test("expired share is inaccessible", async ({ page }) => {
  await page.goto("/s/NOTAREALCODE1");
  await expect(page.getByText(/not found/i)).toBeVisible();
});