/*global page*/

import { host } from '../config';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

export async function displayGraph() {
  const pageID = page.url().split("/").pop();
  const pageUrl = `${host}/page/` + pageID;

  await expect(page).toClick('a', { text: '(view page)' });

  //waits until the target is available [see browser.targets]
  const graphsPageTarget = await browser.waitForTarget(target => target.url() === pageUrl);
  const graphsPage = await graphsPageTarget.page();
  await graphsPage.waitFor(2000); // wait for the chart visualization animations to end
  
  return graphsPage;
}
