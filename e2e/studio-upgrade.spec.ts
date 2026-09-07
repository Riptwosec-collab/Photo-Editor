import { test, expect } from "@playwright/test";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAIAAADkharWAAAAF0lEQVR4nGOsCDjBQApgIkn1qIYRpAEAsVkBqEXr8uYAAAAASUVORK5CYII=", "base64");

test("all menus reach working settings and retain preferences", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "All menus" }).click();
  else await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("textbox", { name: "Search menus" }).fill("Settings");
  await page.getByRole("dialog").getByRole("link", { name: /Settings/ }).click();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await page.getByRole("switch", { name: "Performance mode" }).check();
  await page.getByRole("switch", { name: "Reduce motion" }).check();
  await page.reload();
  await expect(page.getByRole("switch", { name: "Performance mode" })).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("measured light correction changes pixels and grid comparison renders", async ({ page }) => {
  await page.goto("/editor?tool=assistant");
  await page.locator('input[type="file"]').first().setInputFiles({ name: "analysis.png", mimeType: "image/png", buffer: png });
  await expect(page.getByLabel("Edited image preview")).toBeVisible();
  await page.getByRole("button", { name: "Analyze photo", exact: true }).click();
  await expect(page.getByText("Mean luminance")).toBeVisible();
  await page.getByRole("button", { name: "Apply light correction" }).click();
  await expect(page.locator(".professional-toast")).toContainText("Measured light correction applied");
  await page.getByTitle("Collapse AI Assistant").click();
  // Default vertical -> horizontal -> blink -> grid.
  for (let i = 0; i < 3; i++) await page.getByTitle("Cycle comparison layouts").click();
  await expect(page.locator(".grid-quadrant canvas")).toHaveCount(4);
  await expect.poll(async () => page.locator(".grid-quadrant canvas").evaluateAll((items) => items.every((item) => {
    const canvas = item as HTMLCanvasElement;
    return canvas.width > 0 && canvas.getContext("2d")!.getImageData(0, 0, 1, 1).data[3] > 0;
  }))).toBe(true);
});

test("legacy batch menu opens the functional batch workspace", async ({ page }) => {
  await page.goto("/batch-edit");
  await expect(page).toHaveURL(/\/batch$/);
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
});
