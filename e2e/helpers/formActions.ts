import { HTTPResponse } from 'puppeteer';

export const scrollTo = async (selector: string): Promise<void> => {
  await page.evaluate(str => document.querySelector(str)?.scrollIntoView(), selector);
};

export const selectDate = async (selector: string, value: string, options?: any): Promise<void> => {
  await scrollTo(selector);
  await expect(page).toFill(selector, value, options);
  await expect(page).toClick('.react-datepicker__day--selected');
};

export const clearInput = async (selector: string): Promise<void> => {
  await expect(page).toClick(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
};

export const clearAndType = async (selector: string, text: string) => {
  await clearInput(selector);
  await page.type(selector, text);
};

export const waitForNavigation = async (
  action: Promise<void>
): Promise<[void, HTTPResponse | null]> => Promise.all([action, page.waitForNavigation()]);

export const uploadFileInMetadataField = async (filepath: string, fileInputSelector: string) => {
  await page.waitForSelector(fileInputSelector);
  const button = await page.$(fileInputSelector);

  if (button) {
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      // @ts-ignore:next-line
      button.evaluate(b => b.click()),
    ]);
    await fileChooser.accept([filepath]);
  }
};
