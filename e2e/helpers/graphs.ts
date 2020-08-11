/*global page*/

import { host } from '../config';
// @ts-ignore
import { toMatchImageSnapshot } from 'jest-image-snapshot';

expect.extend({ toMatchImageSnapshot });

export async function displayGraph(type: string) {
  const pageID = page.url().split("/").pop();
  const pageUrl = `${host}/page/` + pageID;

  await expect(page).toClick('a', { text: '(view page)' });

  //waits until the target is available [see browser.targets]
  const graphsPageTarget = await browser.waitForTarget(target => target.url() === pageUrl);
  const graphsPage = await graphsPageTarget.page();
  await graphsPage.waitFor(4000); // wait for the chart visualization animations to end
  
  let chartContainer;
  if(type === 'list'){
    chartContainer = await graphsPage.$('.ListChart ');
  } else {
    chartContainer = await graphsPage.$('.recharts-responsive-container');
  }
  
  // @ts-ignore
  const chartScreenshot = await chartContainer.screenshot();

  expect(chartScreenshot).toMatchImageSnapshot({
    failureThreshold: 0.03,
    failureThresholdType: 'percent',
    allowSizeMismatch: true,
  });

  await graphsPage.close();
}

