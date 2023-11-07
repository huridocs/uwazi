import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import disableTransitions from '../helpers/disableTransitions';
import { goToRestrictedEntities } from '../helpers/publishedFilter';
import { expectDocumentCountAfterSearch, refreshIndex } from '../helpers/elastichelpers';

const templateFieldSelector = '#metadataForm > div:nth-child(2) > ul > li:nth-child(3) > select';
const entityTemplateTagSelector = (cardSelector: string) =>
  `${cardSelector} .item-actions .btn-color`;
const entityTitle = (cardSelector: string) => `${cardSelector} .item-name`;
const firstEntitySelector = 'main > div.documents-list div.item-group > div:nth-child(1)';

const getText = async (selector: string) => {
  const elem = await page.$(selector);
  return page.evaluate(el => el.textContent, elem);
};

describe('Uploads', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  it('Should show the restricted entities', async () => {
    await goToRestrictedEntities();
    await expectDocumentCountAfterSearch(page, 5);
  });

  it("should change an entity's template", async () => {
    await expect(page).toClick('.item-document', {
      text: 'Aitken',
    });
    await page.waitForSelector('.is-active button.edit-metadata');
    await expect(page).toClick('button', { text: 'Edit' });
    await expect(page).toSelect(templateFieldSelector, 'Causa');
    await page.waitForSelector('.is-active button[type="submit"]');
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toClick('.alert.alert-success');
    await expect(page).toClick(
      'aside.metadata-sidepanel.is-active > div.sidepanel-header > button.close-modal'
    );
  });

  describe('when filtering by type', () => {
    it('should show only the filtered entities', async () => {
      await refreshIndex();
      await expect(page).toClick('#filtersForm li.wide.documentTypes-selector > ul > li', {
        text: 'Causa',
      });
      await expectDocumentCountAfterSearch(page, 1);
    });
  });

  describe('when uploading a pdf', () => {
    it('should create the new document and assign default template', async () => {
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('label[for="pdf-upload-button"]'),
      ]);
      await fileChooser.accept([`${__dirname}/../test_files/valid.pdf`]);
      await expectDocumentCountAfterSearch(page, 2);

      const title = await getText(entityTitle(firstEntitySelector));
      expect(title).toBe('Valid');

      await page.waitForSelector(entityTemplateTagSelector(firstEntitySelector));
      const templateName = await getText(entityTemplateTagSelector(firstEntitySelector));
      expect(templateName).toBe('Mecanismo');
    });
  });

  describe('when processing fails', () => {
    it('should create the document and show "Conversion failed"', async () => {
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('label[for="pdf-upload-button"]'),
      ]);

      await fileChooser.accept([`${__dirname}/../test_files/invalid.pdf`]);
      await expect(page).toMatchElement('span', { text: 'Invalid' });
      await expectDocumentCountAfterSearch(page, 3);

      const title = await getText(entityTitle(firstEntitySelector));
      expect(title).toBe('Invalid');

      await page.waitForFunction(
        `document.querySelector('${firstEntitySelector}').innerText.includes('Conversion failed')`
      );
    });
  });

  describe('when editing the main file', () => {
    it('should change the language of the document', async () => {
      await expect(page).toClick('.item-document', {
        text: 'Valid',
      });
      await page.waitForSelector('.filelist-header');
      await expect(page).toClick('.file-edit', { text: 'Edit' });
      await expect(page).toSelect('#language', 'English (English)');
      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toClick('div.alert', { text: 'File updated' });
      await expect(page).toClick('.is-active .closeSidepanel');
    });
  });

  afterAll(async () => {
    await logout();
  });
});
