import { test, expect } from "@playwright/test";

test("register a second device, verify, rename, delete", async ({
  browser,
}) => {
  const context = await browser.newContext({
    storageState: "e2e/.auth/user.json",
  });
  const page = await context.newPage();

  await page.goto("/dashboard/devices");

  // A second context simulates a second device registering under the same account.
  const context2 = await browser.newContext({
    storageState: "e2e/.auth/user.json",
  });
  const page2 = await context2.newPage();
  await page2.goto("/"); // triggers DeviceRegistrar with a fresh localStorage clientId
  await context2.close();

  await page.reload();
  await expect(page.getByText(/my devices/i)).toBeVisible();

  // Rename the most recently seen (non-current) device.
  const renameButtons = page.getByRole("button", { name: /rename/i });
  await renameButtons.first().click();
  await page.getByRole("textbox").fill("Renamed Test Device");
  await page.getByRole("button", { name: /save/i }).click();
  await expect(page.getByText("Renamed Test Device")).toBeVisible();

  // Delete it.
  const removeButtons = page
    .getByRole("button", { name: /remove/i, exact: false })
    .filter({ hasNotText: /current/i });
  await removeButtons.first().click();
  await page.getByRole("button", { name: /^remove$/i }).click();
  await expect(page.getByText("Renamed Test Device")).not.toBeVisible();

  await context.close();
});
