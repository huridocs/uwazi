import disableTransitions from './disableTransitions';

const changeLanguage = async (language: string) => {
  await expect(page).toClick('.menuNav-language > .dropdown');
  await expect(page).toClick('.dropdown-menu > li > a', { text: language });
  await page.waitForNavigation();
  await disableTransitions();
};

export { changeLanguage };
