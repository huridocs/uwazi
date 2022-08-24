/*global page*/
// THIS TEST MUST BE RUN IN PRODUCTION
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';

const selectText = async (selector: string) => {
  await page.waitForSelector(selector);
  await expect(page).toClick(selector);
  await page.evaluate(_selector => {
    const range = document.createRange();
    const element = document.querySelector<HTMLElement>(_selector);
    if (element) {
      Array.from(element.childNodes).forEach(node => {
        range.selectNodeContents(node);
      });
      const sel = window.getSelection();
      sel!.removeAllRanges();
      sel!.addRange(range);
    }
  }, selector);
  await page.mouse.up();
};

describe('Entities', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('should find a document then open it', async () => {
    await expect(page).toClick('.item-document:nth-child(1) .view-doc');
  });

  it('should create a new reference to a document', async () => {
    await selectText('.textLayer > span:nth-child(1) > span');

    await expect(page).toClick('.connect-to-p');

    await expect(page).toClick('.side-panel .connections-list li:first-child');

    await expect(page).toFill(
      'aside div.search-box > div > input',
      'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014',
      { delay: 5 }
    );

    await expect(page).toClick('.side-panel .item .item-name', {
      text: 'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014',
    });

    await expect(page).toClick('div.sidepanel-footer > div > button.edit-metadata.btn.btn-success');

    await page.waitForSelector('.show-target-document');
    await selectText('.textLayer > span:nth-child(9)');

    await expect(page).toClick('.btn.btn-success', {
      text: 'Save',
    });

    await expect(page).toMatchElement('.side-panel.is-active .item-snippet', {
      text: 'Urna Semper',
    });
  });

  it('should delete de created reference', async () => {
    await expect(page).toClick('.side-panel .references .item-actions .delete');
    await expect(page).toClick('button', { text: 'Accept' });

    await expect(page).not.toMatchElement('.side-panel.is-active .item-snippet', {
      text: 'Urna Semper',
    });
  });

  afterAll(async () => {
    await logout();
  });
});
