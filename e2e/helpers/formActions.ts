import { Response } from 'puppeteer';

export const scrollTo = async (selector: string): Promise<void> => {
  await page.evaluate(str => document.querySelector(str)?.scrollIntoView(), selector);
};

export const selectDate = async (selector: string, value: string, options?: any): Promise<void> => {
  await expect(page).toFill(selector, value, options);
  await expect(page).toClick('.react-datepicker__day--selected');
};

export const clearInput = async (selector: string): Promise<void> => {
  await expect(page).toClick(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
};

export const waitForNavigation = async (action: Promise<void>): Promise<[void, Response]> =>
  Promise.all([action, page.waitForNavigation()]);
