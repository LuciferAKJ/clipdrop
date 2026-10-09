import { test, expect } from "@playwright/test";

test.beforeEach(async () => {
  test.skip(
    !process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD,
    "Authenticated E2E test requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD to be configured.",
  );
});

test("clipboard syncs from one browser context to another", async ({
  browser,
}) => {
  const contextA = await browser.newContext({
    storageState: "e2e/.auth/user.json",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const contextB = await browser.newContext({
    storageState: "e2e/.auth/user.json",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.goto("/");
  await pageB.goto("/");

  const testValue = `sync-test-${Date.now()}`;
  await pageA.evaluate(
    (value) => navigator.clipboard.writeText(value),
    testValue,
  );

  await pageB.waitForTimeout(6000); // allow at least one 3s poll cycle plus margin

  const bValue = await pageB.evaluate(() => navigator.clipboard.readText());
  expect(bValue).toBe(testValue);

  await contextA.close();
  await contextB.close();
});
