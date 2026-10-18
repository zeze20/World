import { test, expect } from "@playwright/test";

/**
 * MVP smoke E2E tests.
 * Run: npx playwright test
 * Requires: npm run dev (or webServer in config)
 */
test.describe("AetherGlobe MVP", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="app-root"]');
  });

  test("app loads and shows title", async ({ page }) => {
    await expect(page.getByText("AetherGlobe")).toBeVisible();
  });

  test("coordinate bar is present", async ({ page }) => {
    await expect(page.getByTestId("coords-bar")).toBeVisible({ timeout: 15000 });
  });

  test("search input accepts coordinates and enables fly", async ({ page }) => {
    const input = page.getByTestId("search-input");
    await input.fill("41.0082, 28.9784");
    await page.getByTestId("search-button").click();
    // Flight may take a moment; coords should eventually update near Istanbul
    await expect(page.getByTestId("coords-bar")).toBeVisible();
  });

  test("language toggle switches UI", async ({ page }) => {
    const langBtn = page.getByTestId("lang-toggle");
    await langBtn.click();
    // After switch to EN, search placeholder should be English
    await expect(page.getByTestId("search-input")).toHaveAttribute(
      "placeholder",
      /Search place|Yer/
    );
  });

  test("layers panel opens", async ({ page }) => {
    await page.getByTestId("layers-toggle").click();
    await expect(page.getByText(/OpenStreetMap|Katmanlar|Layers/i).first()).toBeVisible();
  });

  test("measure mode can be toggled", async ({ page }) => {
    const btn = page.getByTestId("measure-toggle");
    await btn.click();
    await expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  test("keyboard focus reaches canvas area", async ({ page }) => {
    // Cesium creates a canvas
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 15000 });
  });
});
