import { test, expect } from "@playwright/test";

test("clipboard sync resumes after a network interruption", async ({
  browser,
}) => {
  const context = await browser.newContext({
    storageState: "e2e/.auth/user.json",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  await page.goto("/");

  await context.setOffline(true);

  const offlineValue = `offline-test-${Date.now()}`;
  await page.evaluate(
    (value) => navigator.clipboard.writeText(value),
    offlineValue,
  );
  await page.waitForTimeout(4000); // push attempt happens and fails while offline

  await context.setOffline(false);
  await page.waitForTimeout(6000); // next scheduled tick should succeed

  // Verify indirectly: a second context should now see the value that
  // was queued while offline, confirming sync recovered automatically.
  const context2 = await browser.newContext({
    storageState: "e2e/.auth/user.json",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page2 = await context2.newPage();
  await page2.goto("/");
  await page2.waitForTimeout(6000);

  const received = await page2.evaluate(() => navigator.clipboard.readText());
  expect(received).toBe(offlineValue);

  await context.close();
  await context2.close();
});
