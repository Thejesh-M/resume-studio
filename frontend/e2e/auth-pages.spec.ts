import { test, expect } from "@playwright/test";
import path from "path";

const SCREENSHOTS_DIR = path.join(__dirname, "screenshots");

/**
 * Auth pages — public-facing auth forms that do not require a signed-in user.
 * Verifies forms render correctly without executing real Firebase calls.
 *
 * Note: CardTitle from @base-ui/react renders as a <div>, not a semantic heading.
 * Use getByText() to locate card titles.
 */

test.describe("Login page (/login)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the Welcome back card title", async ({ page }) => {
    // CardTitle renders as a <div>, not a heading element
    await expect(page.getByText("Welcome back")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "login.png"),
    });
  });

  test("renders the Sign in to your account description", async ({ page }) => {
    await expect(page.getByText("Sign in to your account")).toBeVisible();
  });

  test("renders the email input", async ({ page }) => {
    await expect(page.locator("input#email")).toBeVisible();
  });

  test("renders the password input", async ({ page }) => {
    await expect(page.locator("input#password")).toBeVisible();
  });

  test("renders the Sign In button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeVisible();
  });

  test("has a link to the register page", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /sign up/i })
    ).toBeVisible();
  });

  test("has a Forgot password link", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /forgot password/i })
    ).toBeVisible();
  });
});

test.describe("Register page (/register)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("renders the Create your account card title", async ({ page }) => {
    await expect(page.getByText("Create your account")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "register.png"),
    });
  });

  test("renders the email input", async ({ page }) => {
    await expect(page.locator("input#email")).toBeVisible();
  });

  test("renders the password input", async ({ page }) => {
    await expect(page.locator("input#password")).toBeVisible();
  });

  test("renders the Create Account submit button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /create account/i })
    ).toBeVisible();
  });

  test("has a link back to the login page", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /sign in/i })
    ).toBeVisible();
  });
});

test.describe("Forgot Password page (/forgot-password)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  test("renders the Forgot password card title", async ({ page }) => {
    await expect(page.getByText("Forgot password")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "forgot-password.png"),
    });
  });

  test("renders the reset description text", async ({ page }) => {
    await expect(
      page.getByText(/we'll send you a link to reset your password/i)
    ).toBeVisible();
  });

  test("renders the email input", async ({ page }) => {
    await expect(page.locator("input#email")).toBeVisible();
  });

  test("renders the Send Reset Link button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /send reset link/i })
    ).toBeVisible();
  });

  test("has a link back to login", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /sign in/i })
    ).toBeVisible();
  });
});
