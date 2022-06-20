import disableTransitions from './disableTransitions';

const changeLanguage = async (language: string) => {
  await expect(page).toClick('.menuNav-language .rw-btn');
  await expect(page).toClick('.rw-popup-container li span', { text: language });
  await page.waitForNavigation();
  await disableTransitions();
};

export { changeLanguage };
