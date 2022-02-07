/*global page*/
/*global browser*/

import { toMatchImageSnapshot } from 'jest-image-snapshot';
import _ from 'lodash';
import { ElementHandle } from 'puppeteer';

import { ensure } from 'shared/tsUtils';
import { host } from '../config';

const IMAGE_REGRESSION_THRESHOLD = 0.02;
const IMAGE_REGRESSION_PERCENTAGE = Math.floor(IMAGE_REGRESSION_THRESHOLD * 100);

const prepareToMatchImageSnapshot = () => {
  expect.extend({ toMatchImageSnapshot });
};

const displayGraph = async () => {
  const pageID = page.url().split('/').pop() || '';

  const pageTitle = await page.$eval('.template-name > div > input', input =>
    input.getAttribute('value')
  );

  const pageUrl = `${host}/page/${pageID}/${_.kebabCase(pageTitle || '')}`;

  await expect(page).toClick('a', { text: '(view page)' });

  //waits until the target is available [see browser.targets] this opens on another pane
  const graphsPageTarget = await browser.waitForTarget(target => target.url().includes(pageUrl));
  const graphsPage = await graphsPageTarget.page();
  if (graphsPage === null) {
    throw TypeError('graphsPage should not be null ');
  }
  // wait for the chart visualization animations to end
  await graphsPage.waitFor(4000);
  return graphsPage;
};

const testSelectorShot = async (selector: string, threshold?: number) => {
  await page.waitForSelector(selector);
  const element = ensure<ElementHandle>(await page.$(selector));
  const screenshot = await element.screenshot();
  expect(screenshot).toMatchImageSnapshot({
    failureThreshold: threshold || IMAGE_REGRESSION_THRESHOLD,
    failureThresholdType: 'percent',
    allowSizeMismatch: true,
  });
};

export {
  displayGraph,
  IMAGE_REGRESSION_THRESHOLD,
  IMAGE_REGRESSION_PERCENTAGE,
  prepareToMatchImageSnapshot,
  testSelectorShot,
};
