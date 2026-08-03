import { test, expect } from "@playwright/test";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAIAAADkharWAAAAF0lEQVR4nGOsCDjBQApgIkn1qIYRpAEAsVkBqEXr8uYAAAAASUVORK5CYII=",
  "base64",
);

async function expectCanvasOrReport(page: import("@playwright/test").Page) {
  try {
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });
  } catch (error) {
    console.log("PAGE CONTENT AFTER IMPORT:\n", await page.locator("body").innerText());
    throw error;
  }
}

test.beforeEach(async ({ page }, testInfo) => {
  page.on("console", (message) => {
    if (message.type() === "error") {
      void testInfo.attach("browser-console-error", {
        body: message.text(),
        contentType: "text/plain",
      });
    }
  });
  page.on("pageerror", (error) => {
    void testInfo.attach("page-error", {
      body: error.stack ?? error.message,
      contentType: "text/plain",
    });
  });
});

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
  await expectCanvasOrReport(page);

  const exposure = page.getByRole("slider", { name: "Exposure" });
  await exposure.focus();
  await exposure.press("ArrowRight");
  await expect(exposure).not.toHaveValue("0");
  await page.keyboard.press("Control+z");
  await expect(exposure).toHaveValue("0");

  await page.getByRole("button", { name: /Save project/ }).click();
  await expect(page.locator(".toast")).toContainText(/Project saved locally/);
  await page.getByRole("button", { name: "Versions" }).click();
  await page.getByRole("button", { name: /Create snapshot/ }).click();
  await expect(page.locator(".version-status")).toContainText(/Snapshot created/);

  await page.goto("/projects");
  await expect(page.getByText("fixture", { exact: true })).toBeVisible();
  await page.goto("/export-center");
  await expect(page.getByRole("heading", { name: "Export Center" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export and download/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/instagram-feed\.jpg$/);
  await expect(page.locator(".export-status")).toContainText(/Exported/);
});

test("personal preset can be saved and appears in library", async ({ page }) => {
  await page.goto("/editor");
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "preset-fixture.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expectCanvasOrReport(page);
  page.once("dialog", async (dialog) => dialog.accept("E2E Look"));
  await page.getByRole("button", { name: /Save current/ }).click();
  await expect(page.getByRole("button", { name: /E2E Look/ })).toBeVisible();
  await page.goto("/presets");
  await expect(page.getByText("E2E Look", { exact: true })).toBeVisible();
});
