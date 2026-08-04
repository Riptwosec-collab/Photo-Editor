import { test, expect } from "@playwright/test";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAIAAADkharWAAAAF0lEQVR4nGOsCDjBQApgIkn1qIYRpAEAsVkBqEXr8uYAAAAASUVORK5CYII=",
  "base64",
);

test("mobile editor is canvas-first with functional bottom sheets", async ({ page }) => {
  await page.goto("/editor");

  await expect(page.locator("nav.mobile-navigation")).toBeVisible();
  await expect(page.getByTitle("Open AI Assistant")).toBeVisible();
  await expect(page.getByTitle("Open Editing Inspector")).toBeVisible();

  await page.locator('input[type="file"]').first().setInputFiles({
    name: "mobile-fixture.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByLabel("Edited image preview")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Before", { exact: true })).toBeVisible();
  await expect(page.getByText("After", { exact: true })).toBeVisible();

  await page.getByTitle("Open Editing Inspector").click();
  await expect(page.getByText("Editing Inspector", { exact: true })).toBeVisible();
  const exposure = page.locator("#light-content").getByRole("slider", { name: "Exposure", exact: true });
  await exposure.focus();
  await exposure.press("ArrowRight");
  await expect(exposure).not.toHaveValue("0");
  await page.getByTitle("Collapse inspector").click();

  await page.getByTitle("Open AI Assistant").click();
  await expect(page.getByLabel("AI editing prompt")).toBeVisible();
  await expect(page.getByText("Scene Understanding", { exact: true })).toBeVisible();
  await page.getByTitle("Collapse AI Assistant").click();

  await expect(page.getByRole("link", { name: "Edit" })).toHaveAttribute("aria-current", "page");
});
