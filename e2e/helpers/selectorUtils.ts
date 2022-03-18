import { scrollTo } from './formActions';

const getContentBySelector = async (selector: string) =>
  page.$$eval(selector, items => items.map(item => item.textContent));

async function mouseClick(selector: string, x: number, y: number) {
  await scrollTo(selector);
  const rect = await page.$eval(selector, el => {
    const { top, left, width, height } = el.getBoundingClientRect();
    return { top, left, width, height };
  });
  await page.mouse.click(rect.left + x, rect.top + y);
}

export { getContentBySelector, mouseClick };
