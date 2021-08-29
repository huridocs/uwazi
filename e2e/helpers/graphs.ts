/*global page*/
/*global browser*/

import { toMatchImageSnapshot } from 'jest-image-snapshot';
import _ from 'lodash';
import { host } from '../config';

expect.extend({ toMatchImageSnapshot });

export async function displayGraph() {
  const pageID =
    page
      .url()
      .split('/')
      .pop() || '';

  const pageTitle = await page.$eval('.template-name > div > input', input =>
    input.getAttribute('value')
  );

  const pageUrl = `${host}/page/${pageID}/${_.kebabCase(pageTitle || '')}`;

  await expect(page).toClick('a', { text: '(view page)' });

  //waits until the target is available [see browser.targets] this opens on another pane
  const graphsPageTarget = await browser.waitForTarget(target => target.url().includes(pageUrl));
  const graphsPage = await graphsPageTarget.page();
  // wait for the chart visualization animations to end
  await graphsPage.waitFor(4000);
  return graphsPage;
}
