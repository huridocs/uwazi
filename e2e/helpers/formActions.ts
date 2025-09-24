import { HTTPResponse } from 'puppeteer';

export const scrollTo = async (selector: string): Promise<void> => {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.evaluate(str => document.querySelector(str)?.scrollIntoView(), selector);
};

export const selectDate = async (selector: string, value: string, options?: any): Promise<void> => {
  await scrollTo(selector);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toFill(selector, value, options);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick('.react-datepicker__day--selected');
};

export const clearInput = async (selector: string): Promise<void> => {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await expect(page).toClick(selector, { clickCount: 3 });
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.keyboard.press('Backspace');
};

export const clearAndType = async (selector: string, text: string) => {
  await clearInput(selector);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.type(selector, text);
};

export const waitForNavigation = async (
  action: Promise<void>
  // @ts-expect-error TS(2304): Cannot find name 'page'.
): Promise<[void, HTTPResponse | null]> => Promise.all([action, page.waitForNavigation()]);

export const uploadFileInMetadataField = async (filepath: string, fileInputSelector: string) => {
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  await page.waitForSelector(fileInputSelector);
  // @ts-expect-error TS(2304): Cannot find name 'page'.
  const button = await page.$(fileInputSelector);

  if (button) {
    const [fileChooser] = await Promise.all([
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      page.waitForFileChooser(),
      // @ts-ignore:next-line
      button.evaluate(b => b.click()),
    ]);
    await fileChooser.accept([filepath]);
  }
};
