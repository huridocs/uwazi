import disableTransitions from './disableTransitions';

const changeLanguage = async (language: string) => {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('.menuNav-language > .dropdown');
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('.dropdown-menu > li > a', { text: language });
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.waitForNavigation();
  await disableTransitions();
};

export { changeLanguage };
