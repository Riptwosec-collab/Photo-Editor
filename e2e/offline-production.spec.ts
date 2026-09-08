import {test,expect} from '@playwright/test';
test('production shell recovers a local draft offline and excludes private requests from cache',async({page,context})=>{
 await page.addInitScript(()=>localStorage.setItem('lumaforge-preferences-v1',JSON.stringify({state:{language:'en'},version:0})));
 await page.goto('/settings');await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await page.reload();await page.goto('/editor?tool=layers');
 await page.locator('input[type=file]').first().setInputFiles({name:'offline.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAIAAADkharWAAAAF0lEQVR4nGOsCDjBQApgIkn1qIYRpAEAsVkBqEXr8uYAAAAASUVORK5CYII=','base64')});
 await expect(page.getByLabel('Edited image preview')).toBeVisible();await expect.poll(()=>page.locator('.draft-status').innerText()).toMatch(/Draft saved|บันทึกฉบับร่าง/);
 await page.evaluate(()=>fetch('/api/ai/jobs').catch(()=>null));
 const privateKeys=await page.evaluate(async()=>{const all=[];for(const k of await caches.keys())for(const r of await(await caches.open(k)).keys())if(new URL(r.url).pathname.startsWith('/api/'))all.push(r.url);return all;});expect(privateKeys).toEqual([]);
 await context.setOffline(true);await page.reload();await expect(page.locator('.connection-banner')).toBeVisible();await page.getByRole('button',{name:'Recover draft',exact:true}).first().click();await expect(page.getByLabel('Edited image preview')).toBeVisible();
 await context.setOffline(false);
});
