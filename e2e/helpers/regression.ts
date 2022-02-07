/*global page*/
/*global browser*/

import { toMatchImageSnapshot } from 'jest-image-snapshot';
import _ from 'lodash';
import { ElementHandle, Page } from 'puppeteer';

import { ensure } from 'shared/tsUtils';
import { host } from '../config';

const DEFAULT_IMAGE_REGRESSION_THRESHOLD = 0;

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

const testSelectorShot = async (
  selector: string,
  options: { threshold?: number; page?: Page } = {}
) => {
  const checkedPage = options.page || page;
  await checkedPage.waitForSelector(selector);
  const element = ensure<ElementHandle>(await checkedPage.$(selector));
  const screenshot = await element.screenshot();
  expect(screenshot).toMatchImageSnapshot({
    failureThreshold: options.threshold || DEFAULT_IMAGE_REGRESSION_THRESHOLD,
    failureThresholdType: 'percent',
    allowSizeMismatch: true,
  });
};

export {
  displayGraph,
  DEFAULT_IMAGE_REGRESSION_THRESHOLD,
  prepareToMatchImageSnapshot,
  testSelectorShot,
};
