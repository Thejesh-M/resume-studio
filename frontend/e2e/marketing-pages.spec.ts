import { test, expect } from "@playwright/test";
import path from "path";

const SCREENSHOTS_DIR = path.join(__dirname, "screenshots");

/**
 * Marketing pages — public routes that require no auth.
 * Verifies pages load without errors and key UI content is present.
 *
 * Note: The app uses @base-ui/react Button with nativeButton=false which renders
 * <a role="button"> instead of <a>, so use getByRole('button') for CTA links.
 * CardTitle renders as a <div>, not a heading element.
 */

test.describe("Landing page (/)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the main heading", async ({ page }) => {
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Tailor your resume to");
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "landing-hero.png"),
    });
  });

  test("renders the hero CTA buttons", async ({ page }) => {
    // Buttons render as <a role="button"> due to Base UI nativeButton=false
    await expect(
      page.getByRole("button", { name: /get started free/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /view pricing/i })
    ).toBeVisible();
  });

  test("renders the features section heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /everything you need to land more interviews/i })
    ).toBeVisible();
  });

  test("renders the How it works section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /how it works/i })
    ).toBeVisible();
  });

  test("renders testimonials section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /loved by job seekers/i })
    ).toBeVisible();
  });

  test("renders the stats bar (ATS score stat)", async ({ page }) => {
    await expect(
      page.getByText(/average ats score after tailoring/i)
    ).toBeVisible();
  });
});

test.describe("Pricing page (/pricing)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("renders the pricing heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /simple, transparent pricing/i })
    ).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "pricing.png"),
    });
  });

  test("shows all three plan names as text", async ({ page }) => {
    // Plan names render as <div> (CardTitle from @base-ui/react), not heading elements
    await expect(page.getByText("Free", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Pro", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Power", { exact: true }).first()).toBeVisible();
  });

  test("shows the Most Popular badge on the Pro plan", async ({ page }) => {
    await expect(page.getByText("Most Popular")).toBeVisible();
  });

  test("shows plan prices", async ({ page }) => {
    await expect(page.getByText("$0")).toBeVisible();
    await expect(page.getByText("$19.99")).toBeVisible();
    await expect(page.getByText("$39.99")).toBeVisible();
  });
});

test.describe("Privacy page (/privacy)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/privacy");
  });

  test("renders the Privacy Policy heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /privacy policy/i, level: 1 })
    ).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "privacy.png"),
    });
  });

  test("renders the Introduction section", async ({ page }) => {
    await expect(page.getByText(/1\. Introduction/i)).toBeVisible();
  });
});

test.describe("Terms page (/terms)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/terms");
  });

  test("renders the Terms of Service heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /terms of service/i, level: 1 })
    ).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "terms.png"),
    });
  });

  test("renders the Acceptance of Terms section", async ({ page }) => {
    await expect(page.getByText(/1\. Acceptance of Terms/i)).toBeVisible();
  });
});
