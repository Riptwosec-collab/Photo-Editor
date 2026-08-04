import { test, expect } from "@playwright/test";

test("cloud page preserves local-first workflow when public environment is missing", async ({ page }) => {
  await page.goto("/cloud");

  await expect(page.getByRole("heading", { name: "Cloud Sync" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Environment configuration required" })).toBeVisible();
  await expect(page.getByText(/Local projects remain fully functional/)).toBeVisible();
  await expect(page.getByText("RLS applied", { exact: true })).toBeVisible();
  await expect(page.getByText("Private bucket", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open local projects" })).toHaveAttribute("href", "/projects");
  await expect(page.getByRole("link", { name: "Open editor" })).toHaveAttribute("href", "/editor");

  await expect(page.getByRole("button", { name: /Synchronize local and cloud projects/ })).toHaveCount(0);
  await expect(page.getByText(/Sync finished:/)).toHaveCount(0);
});
