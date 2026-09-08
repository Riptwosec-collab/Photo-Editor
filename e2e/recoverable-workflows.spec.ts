import { test, expect } from "@playwright/test";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAIAAADkharWAAAAF0lEQVR4nGOsCDjBQApgIkn1qIYRpAEAsVkBqEXr8uYAAAAASUVORK5CYII=", "base64");
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("lumaforge-preferences-v1")) localStorage.setItem("lumaforge-preferences-v1", JSON.stringify({ state: { language: "en" }, version: 0 }));
  });
});

test("unsaved image and layer recipe survive reload through draft recovery", async ({ page, isMobile }) => {
  await page.goto("/editor?tool=layers");
  await page.locator('input[type="file"]').first().setInputFiles({ name: "draft.png", mimeType: "image/png", buffer: png });
  await expect(page.getByLabel("Edited image preview")).toBeVisible();
  await page.getByRole("button", { name: "Adjustment", exact: true }).click();
  await page.getByLabel("Layer name", { exact: true }).fill("Recovered light");
  await page.getByLabel("Mask", { exact: true }).selectOption("radial");
  await expect(page.locator(".draft-status")).toContainText("Draft saved on this device");
  await page.reload();
  if (isMobile) await page.getByTitle("Collapse inspector").click();
  await page.getByRole("button", { name: "Recover draft", exact: true }).first().click();
  if (isMobile) await page.getByTitle("Open Editing Inspector").click();
  await expect(page.getByLabel("Layer name", { exact: true })).toHaveValue("Recovered light");
  await expect(page.getByLabel("Mask", { exact: true })).toHaveValue("radial");
  await expect.poll(async () => page.getByLabel("Edited image preview").evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    return canvas.width > 0 && canvas.getContext("2d")!.getImageData(0, 0, 1, 1).data[3] > 0;
  })).toBe(true);
});

test("batch queue resumes after reload and downloads completed files as ZIP", async ({ page }) => {
  await page.goto("/batch");
  await expect(page.locator('input[type="file"]')).toBeEnabled();
  await page.locator('input[type="file"]').setInputFiles({ name: "queued.png", mimeType: "image/png", buffer: png });
  await expect(page.locator(".batch-row")).toContainText("queued.png");
  // Wait for the persisted queue, rather than relying on a fixed delay.
  await expect.poll(async () => page.evaluate(async () => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open("lumaforge-workspace-records");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const query = db.transaction("records").objectStore("records").get("batch:queue");
      query.onsuccess = () => { resolve(query.result?.value?.length ?? 0); db.close(); };
      query.onerror = () => { reject(query.error); db.close(); };
    };
  }))).toBe(1);
  await page.reload();
  await expect(page.locator(".batch-row")).toContainText("queued.png");
  await page.getByRole("button", { name: "Process / Resume" }).click();
  await expect(page.locator(".batch-row")).toContainText("complete", { timeout: 30000 });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download ZIP" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.zip$/);
});

test("theme and Thai language persist across reload", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Theme", { exact: true }).selectOption("graphite");
  await page.getByLabel("Language", { exact: true }).selectOption("th");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "graphite");
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expect(page.getByRole("heading", { name: "การตั้งค่า", exact: true })).toBeVisible();
});
