import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    setup.skip(
      true,
      "E2E_TEST_EMAIL and E2E_TEST_PASSWORD environment variables are not configured. Authenticated E2E tests will be skipped.",
    );
    return;
  }

  await page.goto("/");
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.getByLabel(/email/i).fill(email);
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(
    page.locator("[data-clerk-user-button]").or(page.getByText(/dashboard/i)),
  ).toBeVisible({ timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
