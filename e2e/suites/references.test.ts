/*global page*/
// THIS TEST MUST BE RUN IN PRODUCTION
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

describe('Entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('should find a document then open it', async () => {
    await expect(page).toClick('.item-document:nth-child(1) .view-doc');
    await page.waitForSelector('.textLayer > span:nth-child(1)');
  });

  it('should create a new reference to a document', async () => {
    await page.evaluate(() => {
      const range = document.createRange();
      const element = document.querySelector('.textLayer > span:nth-child(1)');
      if (element) {
        range.selectNodeContents(element);
        const sel = window.getSelection();
        sel!.removeAllRanges();
        sel!.addRange(range);
      }
    });

    await page.mouse.up();

    await expect(page).toClick('.connect-to-d');
    await expect(page).toClick('.side-panel .connections-list li:first-child');
    await expect(page).toClick('.side-panel .item');
    await expect(page).toClick('.side-panel > .sidepanel-footer > .btn-success');
  });

  it('should delete de created reference', async () => {
    await expect(page).toClick('.side-panel .references .item-actions .delete');
    await expect(page).toClick('.modal-content .btn-danger');
  });

  afterAll(async () => {
    await logout();
  });
});
