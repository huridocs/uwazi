/*global page*/
/*global browser*/

import { toMatchImageSnapshot } from 'jest-image-snapshot';
import { host } from '../config';

expect.extend({ toMatchImageSnapshot });

export async function displayGraph() {
  const pageID = page
    .url()
    .split('/')
    .pop();

  const pageUrl = `${host}/page/${pageID}`;

  await expect(page).toClick('a', { text: '(view page)' });

  //waits until the target is available [see browser.targets] this opens on another pane
  const graphsPageTarget = await browser.waitForTarget(target => target.url() === pageUrl);
  const graphsPage = await graphsPageTarget.page();
  // wait for the chart visualization animations to end
  await graphsPage.waitFor(4000);
  return graphsPage;
}
