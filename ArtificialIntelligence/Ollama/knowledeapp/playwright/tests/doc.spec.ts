import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.locator('#menu-toggle-btn').click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: 'Account Info' }).click();
  await page.locator('#menu-toggle-btn').click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('heading', { name: 'Document Manager' }).click();
  await page.getByRole('heading', { name: '📁 Document List' }).click();
  await page.getByRole('columnheader', { name: 'Actions' }).click();
  await page.locator('#menu-button-0').click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('menuitem', { name: '⬇️ Download' }).click();
  await page.locator('#menu-button-0').click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('menuitem', { name: '🗑️ Delete' }).click();
  await page.locator('#menu-button-0').click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('menuitem', { name: '⭐ Favorite' }).click();
  await page.getByText('Quarterly Report 2023.pdf').click();
  await page.getByRole('heading', { name: '📄 Quarterly Report 2023.pdf' }).click();
  await page.getByRole('heading', { name: 'Q4 2023 Financial Report' }).click();
  await page.getByText('Project_Plan_V3.xlsx').click();
  await page.getByRole('heading', { name: 'Project Plan - Website' }).click();
  await page.getByRole('heading', { name: '📄 Project_Plan_V3.xlsx' }).click();
  await page.getByRole('button', { name: 'Upload' }).click();
  await page.getByRole('heading', { name: '📤 Upload Files' }).click();
  await page.getByRole('img').nth(3).click();
  await page.getByRole('button', { name: 'Cancel' }).click();
});