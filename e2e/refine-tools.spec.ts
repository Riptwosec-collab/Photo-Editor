import {test,expect,type Page} from '@playwright/test';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAIAAADkharWAAAAF0lEQVR4nGOsCDjBQApgIkn1qIYRpAEAsVkBqEXr8uYAAAAASUVORK5CYII=','base64');
test.beforeEach(async({page})=>{await page.addInitScript(()=>{if(!localStorage.getItem('lumaforge-preferences-v1'))localStorage.setItem('lumaforge-preferences-v1',JSON.stringify({state:{language:'en'},version:0}));});});
async function imported(page:Page){await page.goto('/editor?tool=layers');await page.locator('input[type=file]').first().setInputFiles({name:'refine.png',mimeType:'image/png',buffer:png});await expect(page.getByLabel('Edited image preview')).toBeVisible();}
test('transform is keyboard accessible and survives draft recovery',async({page,isMobile})=>{
 await imported(page);await page.locator('.layer-actions').getByRole('button',{name:'Text',exact:true}).click();
 await page.getByText('Transform layer',{exact:true}).click();await page.getByRole('button',{name:'Transform on image',exact:true}).click();
 if(isMobile)await page.getByTitle('Collapse inspector').click();
 await page.getByRole('button',{name:'Rotate layer',exact:true}).press('ArrowRight');
 if(isMobile)await page.getByTitle('Open Editing Inspector').click();
 await expect(page.getByLabel('Transform rotation',{exact:true})).toHaveValue('1');
 await expect(page.locator('.draft-status')).toContainText('Draft saved on this device');await page.reload();
 if(isMobile)await page.getByTitle('Collapse inspector').click();await page.getByRole('button',{name:'Recover draft',exact:true}).first().click();
 if(isMobile)await page.getByTitle('Open Editing Inspector').click();await page.getByText('Transform layer',{exact:true}).click();await expect(page.getByLabel('Transform rotation',{exact:true})).toHaveValue('1');
});
test('healing spots are reversible',async({page,isMobile})=>{
 await imported(page);await page.locator('.creative-tools summary').filter({hasText:'Portrait retouch'}).click();await page.getByRole('button',{name:'Healing brush',exact:true}).click();
 if(isMobile)await page.getByTitle('Collapse inspector').click();
 await page.getByLabel('Paint layer mask').click();
 if(isMobile)await page.getByTitle('Open Editing Inspector').click();await expect(page.locator('.retouch-count')).toHaveText('1');
 if(isMobile)await page.getByTitle('Collapse inspector').click();await page.getByRole('button',{name:'Undo',exact:true}).click();
 if(isMobile)await page.getByTitle('Open Editing Inspector').click();await expect(page.locator('.retouch-count')).toHaveText('0');
});
test('selective color renders through a radial mask and refinement keeps its coverage',async({page})=>{
 await imported(page);await page.locator('.layer-actions').getByRole('button',{name:'Adjustment',exact:true}).click();await page.getByLabel('Mask',{exact:true}).selectOption('radial');
 await page.getByText('Replace selected color',{exact:true}).click();await page.getByLabel('Color strength',{exact:true}).press('End');
 await expect.poll(()=>page.getByLabel('Edited image preview').evaluate(node=>{const c=node as HTMLCanvasElement,ctx=c.getContext('2d')!;return ctx.getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data[2]>ctx.getImageData(0,0,1,1).data[2];})).toBe(true);
 await page.getByText('Refine mask edges',{exact:true}).click();await page.getByLabel('edgeShift',{exact:true}).press('ArrowRight');await page.getByRole('button',{name:'Refine with brush',exact:true}).click();await expect(page.getByLabel('Mask',{exact:true})).toHaveValue('brush');
});
test('export exposes accurate color conversion choices',async({page,isMobile})=>{
 await imported(page);if(isMobile)await page.getByTitle('Collapse inspector').click();await page.getByRole('button',{name:'Save project',exact:true}).click();await expect(page.locator('.professional-toast')).toContainText('saved locally');
 await page.goto('/export-center');await expect(page.getByLabel('Output color space')).toHaveValue('srgb');await page.getByLabel('Output color space').selectOption('display-p3');await expect(page.getByText(/Editing uses sRGB/)).toBeVisible();
});
test('48 MP original imports with bounded preview and survives reload',async({page,isMobile})=>{
 test.setTimeout(90000);await page.goto('/editor?tool=layers');
 const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=8000;c.height=6000;const ctx=c.getContext('2d')!;ctx.fillStyle='#607090';ctx.fillRect(0,0,c.width,c.height);const url=c.toDataURL('image/png');c.width=c.height=0;return url.split(',')[1];});
 await page.locator('input[type=file]').first().setInputFiles({name:'48mp.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});
 await expect(page.getByLabel('Edited image preview')).toBeVisible();await expect.poll(()=>page.getByLabel('Edited image preview').evaluate(n=>(n as HTMLCanvasElement).width)).toBeLessThanOrEqual(1800);
 await expect(page.locator('.draft-status')).toContainText('Draft saved on this device');await page.reload();if(isMobile)await page.getByTitle('Collapse inspector').click();await page.getByRole('button',{name:'Recover draft',exact:true}).first().click();await expect(page.getByLabel('Edited image preview')).toBeVisible();
});

test('imported raster overlays the original and keeps transparent margins',async({page})=>{
 await imported(page);await page.getByLabel('Add image layer',{exact:true}).setInputFiles({name:'overlay.png',mimeType:'image/png',buffer:png});await expect(page.locator('.layer-row')).toHaveCount(1);
 await page.getByText('Transform layer',{exact:true}).click();await expect(page.getByLabel('Transform scale',{exact:true})).toHaveValue('0.5');
 await expect.poll(()=>page.getByLabel('Edited image preview').evaluate(n=>(n as HTMLCanvasElement).getContext('2d')!.getImageData(0,0,1,1).data[3])).toBe(255);
});
