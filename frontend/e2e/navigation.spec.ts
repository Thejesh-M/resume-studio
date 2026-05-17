import { test, expect } from "@playwright/test";
import path from "path";

const SCREENSHOTS_DIR = path.join(__dirname, "screenshots");

/**
 * Navigation — verifies the marketing navbar contains correct links
 * and that clicking them navigates to the right pages.
 *
 * Note: Buttons rendered with nativeButton=false use <a role="button">.
 * Use getByRole('button') for those, and getByRole('link') for plain anchors.
 */

test.describe("Marketing navbar navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("navbar brand link is present and links to home", async ({ page }) => {
    const brand = page.getByRole("link", { name: "ResumeTuner" });
    await expect(brand).toBeVisible();
    await expect(brand).toHaveAttribute("href", "/");
  });

  test("Pricing nav link is present in desktop nav", async ({ page }) => {
    // The <nav> in the desktop header contains plain anchor links
    const desktopNav = page.locator("header nav");
    const pricingLink = desktopNav.getByRole("link", { name: "Pricing" });
    await expect(pricingLink).toBeVisible();
  });

  test("Pricing nav link navigates to /pricing", async ({ page }) => {
    const desktopNav = page.locator("header nav");
    const pricingLink = desktopNav.getByRole("link", { name: "Pricing" });
    await pricingLink.click();

    await expect(page).toHaveURL(/\/pricing/);
    await expect(
      page.getByRole("heading", { name: /simple, transparent pricing/i })
    ).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "nav-to-pricing.png"),
    });
  });

  test("Templates nav link is present in desktop nav", async ({ page }) => {
    const desktopNav = page.locator("header nav");
    const templatesLink = desktopNav.getByRole("link", { name: "Templates" });
    await expect(templatesLink).toBeVisible();
  });

  test("Templates nav link navigates away from home", async ({ page }) => {
    const desktopNav = page.locator("header nav");
    const templatesLink = desktopNav.getByRole("link", { name: "Templates" });
    await templatesLink.click();

    // /templates either shows public templates or redirects to login if page not yet built
    await expect(page).toHaveURL(/\/templates|\/login/);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "nav-to-templates.png"),
    });
  });

  test("Log In button is in the header and links to /login", async ({ page }) => {
    // Log In renders as <a role="button"> in the header
    const loginBtn = page.locator("header").getByRole("button", { name: /log in/i });
    await expect(loginBtn).toBeVisible();
    await loginBtn.click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("Get Started button is in the header and links to /register", async ({
    page,
  }) => {
    // Get Started renders as <a role="button"> in the header
    const getStartedBtn = page.locator("header").getByRole("button", { name: /^get started$/i });
    await expect(getStartedBtn).toBeVisible();
    await getStartedBtn.click();

    await expect(page).toHaveURL(/\/register/);
  });
});
