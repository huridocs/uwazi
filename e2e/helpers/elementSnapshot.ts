import sharp from 'sharp';
import { ElementHandle, Page } from 'puppeteer';
import { ensure } from 'shared/tsUtils';

const DEFAULT_WIDTH = 1000;

const resizeImage = async (image: string, width: number) =>
  sharp(image)
    .resize(width)
    .toBuffer();

export const getContainerScreenshot = async (
  page: Page,
  className: string,
  width: number = DEFAULT_WIDTH
) => {
  await page.waitForSelector(className);
  const chartContainer = ensure<ElementHandle>(await page.$(className));
  return resizeImage(await chartContainer.screenshot(), width);
};
