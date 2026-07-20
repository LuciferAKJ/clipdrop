import { test, expect } from "@playwright/test";
import path from "path";

test("sign in, upload a file, create a share, download it", async ({
  page,
}) => {
  await page.goto("/");

  const filePath = path.join(__dirname, "fixtures", "test-file.txt");
  await page.setInputFiles('input[type="file"]', filePath);

  await page.getByRole("button", { name: /create share/i }).click();

  const codeLocator = page.locator("p.font-mono");
  await expect(codeLocator).toBeVisible({ timeout: 10000 });
  const code = await codeLocator.textContent();

  await page.goto(`/s/${code}`);
  const downloadPromise = page.waitForEvent("download");
  await page.getByText(/test-file\.txt/i).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("test-file");
});
