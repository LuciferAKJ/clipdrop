import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL!);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/password/i).fill(process.env.E2E_TEST_PASSWORD!);
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(
    page.locator("[data-clerk-user-button]").or(page.getByText(/dashboard/i)),
  ).toBeVisible({ timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
