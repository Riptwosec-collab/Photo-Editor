import {test,expect} from '@playwright/test';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAIAAADkharWAAAAF0lEQVR4nGOsCDjBQApgIkn1qIYRpAEAsVkBqEXr8uYAAAAASUVORK5CYII=','base64');
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('lumaforge-preferences-v1',JSON.stringify({state:{language:'en'},version:0})));});
async function imported(page:import('@playwright/test').Page){await page.goto('/editor?tool=layers');await page.locator('input[type=file]').first().setInputFiles({name:'creative.png',mimeType:'image/png',buffer:png});await expect(page.getByLabel('Edited image preview')).toBeVisible();}
test('story templates and RGB layers survive draft recovery',async({page,isMobile})=>{
 await imported(page);await page.locator('.creative-tools summary').filter({hasText:'Templates'}).click();await page.getByRole('button',{name:'Story',exact:false}).filter({hasText:'9:16'}).click();
 await expect(page.locator('.layer-row')).toHaveCount(2);
 await page.locator('.creative-tools summary').filter({hasText:'Pro color'}).click();await page.getByRole('button',{name:'Add RGB curves'}).click();await page.getByLabel('red curve 50%').focus();await page.getByLabel('red curve 50%').press('End');
 await expect(page.locator('.draft-status')).toContainText('Draft saved on this device');await page.reload();if(isMobile)await page.getByTitle('Collapse inspector').click();await page.getByRole('button',{name:'Recover draft',exact:true}).first().click();if(isMobile)await page.getByTitle('Open Editing Inspector').click();
 await expect(page.locator('.layer-row')).toHaveCount(3);await page.locator('.creative-tools summary').filter({hasText:'Pro color'}).click();await expect(page.getByLabel('red curve 50%')).toHaveValue('1');
});
test('library organizes identical images and restores projects from trash',async({page,isMobile})=>{
 await imported(page);if(isMobile)await page.getByTitle('Collapse inspector').click();await page.getByRole('button',{name:'Save project',exact:true}).click();await expect(page.locator('.professional-toast')).toContainText('saved locally');await page.goto('/projects');await expect(page.locator('.project-card')).toHaveCount(1);
 await page.getByTitle('Duplicate',{exact:true}).click();await expect(page.locator('.project-card')).toHaveCount(2);await page.getByRole('button',{name:'Find exact duplicates'}).click();await expect(page.locator('.duplicate-badge')).toHaveCount(2);
 let prompt=0;page.on('dialog',dialog=>dialog.accept(prompt++===0?'Products':'summer, launch'));await page.getByRole('button',{name:'Organize',exact:true}).first().click();await expect(page.locator('.project-tags').filter({hasText:'Products'})).toHaveCount(1);
 await page.getByTitle('Move to trash').first().click();await expect(page.locator('.project-card')).toHaveCount(1);await page.getByLabel('Trash',{exact:true}).check();await expect(page.locator('.project-card')).toHaveCount(1);await page.getByRole('button',{name:'Restore from trash'}).click();await expect(page.locator('.project-card')).toHaveCount(0);await page.getByLabel('Trash',{exact:true}).uncheck();await expect(page.locator('.project-card')).toHaveCount(2);
});
test('CUBE import applies color while malformed LUTs leave the current layers intact',async({page})=>{
 await imported(page);await page.locator('.creative-tools summary').filter({hasText:'Pro color'}).click();const input=page.locator('input[accept=".cube"]');
 await input.setInputFiles({name:'broken.cube',mimeType:'text/plain',buffer:Buffer.from('LUT_3D_SIZE 2\n0 0 0')});await expect(page.locator('.creative-tools [role=status]')).toContainText('Incomplete');await expect(page.locator('.layer-row')).toHaveCount(0);
 const cube='TITLE "Black LUT"\nLUT_3D_SIZE 2\n'+Array(8).fill('0 0 0').join('\n');await input.setInputFiles({name:'black.cube',mimeType:'text/plain',buffer:Buffer.from(cube)});await expect(page.locator('.layer-row')).toHaveCount(1);await expect.poll(()=>page.getByLabel('Edited image preview').evaluate(node=>{const c=node as HTMLCanvasElement;return c.getContext('2d')!.getImageData(0,0,1,1).data[0];})).toBe(0);
});
