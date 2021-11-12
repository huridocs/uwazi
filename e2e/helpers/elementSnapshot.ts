import sharp from 'sharp';
import { ElementHandle } from 'puppeteer';
import { ensure } from 'shared/tsUtils';

const DEFAULT_WIDTH = 1000;

const resizeImage = async (image: any, width: number) =>
  sharp(image)
    .resize(width)
    .toBuffer();

export const getContainerScreenshot = async (
  page: any,
  className: string,
  width: number = DEFAULT_WIDTH
) => {
  const chartContainer = ensure<ElementHandle>(await page.$(className));
  return resizeImage(await chartContainer.screenshot(), width);
};
