export const createTemplate = async (name: string) => {
  await expect(page).toClick('[href="/en/settings/account"]');
  await expect(page).toClick('span', { text: 'Templates' });
  await expect(page).toClick('span', { text: 'Add template' });
  await expect(page).toFill('input[name="template.data.name"]', name);
  if (name === 'With image') {
    await page.waitForSelector('ul.property-options-list > .list-group-item');
    const imageElement = await page.$$('ul.property-options-list > .list-group-item');
    const button = await imageElement[11].$$('button');
    await button[0].click();
  }
  await expect(page).toClick('button[type="submit"]');
  await expect(page).toClick('span', { text: 'Saved successfully.' });
};
