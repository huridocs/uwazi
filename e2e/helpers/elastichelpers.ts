import { Page } from 'puppeteer';
import superagent from 'superagent';

export async function refreshIndex() {
  const elasticSearchServer = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  const index = process.env.INDEX_NAME || 'uwazi_e2e';

  return superagent.post(`${elasticSearchServer}/${index}/_refresh`);
}

export async function expectDocumentCountAfterSearch(page: Page, count: number) {
  await page.waitForFunction(`document.querySelectorAll(".item-document").length === ${count}`);
  const entities = await page.$$('.item-document');
  expect(entities.length).toBe(count);
}
