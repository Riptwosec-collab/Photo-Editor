import { test, expect } from "@playwright/test";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAFElEQVR4nGP4z8AARAz///8H0wYAObgH/aX9ZAAAAABJRU5ErkJggg==",
  "base64",
);

test("landing opens functional editor", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /เริ่มแต่งภาพ/ }).click();
  await expect(page.getByText(/ลากภาพมาวาง/)).toBeVisible();
});

test("local editing, project, snapshot and export flow", async ({ page }) => {
  await page.goto("/editor");
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "fixture.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.locator("canvas").first()).toBeVisible();

  const exposure = page.getByLabel("Exposure");
  await exposure.fill("0.5");
  await exposure.press("ArrowRight");
  await expect(exposure).not.toHaveValue("0");
  await page.keyboard.press("Control+z");
  await expect(exposure).toHaveValue("0");

  await page.getByRole("button", { name: /Save project/ }).click();
  await expect(page.getByRole("status")).toContainText(/Project saved locally/);
  await page.getByRole("button", { name: "Versions" }).click();
  await page.getByRole("button", { name: /Create snapshot/ }).click();
  await expect(page.getByRole("status")).toContainText(/Snapshot created/);

  await page.goto("/projects");
  await expect(page.getByText("fixture", { exact: true })).toBeVisible();
  await page.goto("/export-center");
  await expect(page.getByRole("heading", { name: "Export Center" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export and download/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/instagram-feed\.jpg$/);
  await expect(page.getByRole("status")).toContainText(/Exported/);
});

test("personal preset can be saved and appears in library", async ({ page }) => {
  await page.goto("/editor");
  await page.locator('input[type="file"]').first().setInputFiles({ name: "preset-fixture.png", mimeType: "image/png", buffer: png });
  page.once("dialog", async (dialog) => dialog.accept("E2E Look"));
  await page.getByRole("button", { name: /Save current/ }).click();
  await page.goto("/presets");
  await expect(page.getByText("E2E Look", { exact: true })).toBeVisible();
});
