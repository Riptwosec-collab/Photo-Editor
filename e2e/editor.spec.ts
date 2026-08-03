import { test, expect } from "@playwright/test";
test("landing opens functional editor",async({page})=>{await page.goto("/");await page.getByRole("link",{name:/เริ่มแต่งภาพ/}).click();await expect(page.getByText(/ลากภาพมาวาง/)).toBeVisible();});
test("status modules do not claim fake completion",async({page})=>{await page.goto("/marketplace");await expect(page.getByText("NOT STARTED")).toBeVisible();await expect(page.getByText(/No fake checkout/)).toBeVisible();});
