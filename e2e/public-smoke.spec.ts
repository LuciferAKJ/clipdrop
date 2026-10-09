import { test, expect } from "@playwright/test";

test.describe("Public Smoke Tests", () => {
  test("homepage renders hero, upload dropzone, and receive card", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify page title and brand
    await expect(page).toHaveTitle(/ClipDrop/i);
    await expect(
      page.getByText("TRANSIT PROTOCOL", { exact: false }),
    ).toBeVisible();

    // Verify upload dropzone elements
    await expect(
      page.getByText(/Drag & drop files, click to browse, or paste image/i),
    ).toBeVisible();
    await expect(page.getByText(/Up to 10 MB each/i)).toBeVisible();

    // Verify receive transit card
    await expect(
      page.getByRole("heading", { name: /receive a share/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/transit code/i)).toBeVisible();

    // Verify product capability architecture cards
    await expect(
      page.getByRole("heading", { name: /controlled access/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /ephemeral by design/i }),
    ).toBeVisible();
  });

  test("homepage FAQ accordion opens and displays answers", async ({
    page,
  }) => {
    await page.goto("/");

    const faqQuestion = page.getByText(
      /do recipients need an account to download files\?/i,
    );
    await expect(faqQuestion).toBeVisible();

    // Click to expand accordion summary
    await faqQuestion.click();

    // Content inside the details should become visible
    await expect(
      page.getByText(
        /anyone with the 6-character share code or direct link can access/i,
      ),
    ).toBeVisible();
  });

  test("privacy policy page renders and navigates back home", async ({
    page,
  }) => {
    await page.goto("/privacy");

    // Title and main heading
    await expect(
      page.getByRole("heading", { name: /privacy policy/i, level: 1 }),
    ).toBeVisible();

    // Notice banner
    await expect(
      page.getByText(/operational scope & sensitive data notice/i),
    ).toBeVisible();

    // Key technical sections
    await expect(page.getByText(/1\. Information We Process/i)).toBeVisible();
    await expect(
      page.getByText(/2\. Expiration & Automated Destruction/i),
    ).toBeVisible();
    await expect(
      page.getByText(/4\. User Sovereignty & Data Control/i),
    ).toBeVisible();

    // Back to home link
    const backLink = page.getByRole("link", { name: /back to home/i });
    await expect(backLink).toBeVisible();
    await backLink.click();

    // Should return to homepage
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByText(/Drag & drop files, click to browse, or paste image/i),
    ).toBeVisible();
  });

  test("404 not-found page renders correctly and navigates back home", async ({
    page,
  }) => {
    await page.goto("/non-existent-route-for-404-smoke-test");

    // 404 badge & message
    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /page not found/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/the share or page you are looking for does not exist/i),
    ).toBeVisible();

    // Back to Home button
    const backHome = page.getByRole("link", { name: /back to home/i });
    await expect(backHome).toBeVisible();
    await backHome.click();

    await expect(page).toHaveURL(/\/$/);
  });

  test("invalid or non-existent share code displays not found state safely", async ({
    page,
  }) => {
    await page.goto("/s/INVALID999");

    // Should render the error/expired state cleanly without unhandled exception
    await expect(
      page.getByRole("heading", { name: /share not found/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Back to Home button on error card
    const returnHomeBtn = page.getByRole("button", { name: /back to home/i });
    await expect(returnHomeBtn).toBeVisible();
    await returnHomeBtn.click();

    await expect(page).toHaveURL(/\/$/);
  });

  test("footer renders navigation links and navigates to privacy", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const privacyLink = footer.getByRole("link", { name: /privacy/i });
    await expect(privacyLink).toBeVisible();
    await privacyLink.click();

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(
      page.getByRole("heading", { name: /privacy policy/i, level: 1 }),
    ).toBeVisible();
  });
});
