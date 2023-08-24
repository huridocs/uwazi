import { ElementHandle, Page } from 'puppeteer';

import { scrollTo } from './formActions';

const checkStringValuesInSelectors = async (
  values: {
    selector: string | null;
    expected: any;
  }[]
) => {
  values.map(async ({ selector, expected }) => {
    await expect(selector).toMatch(expected);
  });
};

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

const getPropertyOfSelector = async (
  element: ElementHandle | Page | null,
  selector: string,
  property: string
) =>
  element
    ?.$(selector)
    .then(async input => input?.getProperty(property))
    .then(async input => input?.jsonValue<string>());

const getPropertiesOfSubelements = async (
  element: ElementHandle | Page,
  topSelector: string,
  subSelector: string,
  property: string
) =>
  (
    await Promise.all(
      (await element.$$(topSelector)).map(async item =>
        getPropertyOfSelector(item, subSelector, property)
      )
    )
  ).filter(s => s);

export {
  getContentBySelector,
  mouseClick,
  checkStringValuesInSelectors,
  getPropertyOfSelector,
  getPropertiesOfSubelements,
};
