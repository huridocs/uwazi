import { waitForNavigation } from '../helpers/formActions';
import disableTransitions from '../helpers/disableTransitions';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import { host } from '../config';

describe('Metadata', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
  });

  afterAll(async () => {
    await logout();
  });

  beforeEach(async () => {
    await waitForNavigation(expect(page).toClick('a', { text: 'Settings' }));
    await disableTransitions();
    expect(page.url()).toBe(`${host}/en/settings/account`);
  });

  describe('Templates tests', () => {
    const createFromModal = async (button: string, inputSelector: string, newIntem: string) => {
      await expect(page).toClick('a', { text: 'Templates' });
      await expect(page).toClick('a', { text: 'My edited template' });
      await expect(page).toClick('button', { text: button });
      await expect(page).toFill(inputSelector, newIntem);
      await expect(page).toClick('.modal-footer > button', { text: 'Save' });
      await expect(page).toClick('.alert.alert-success');
    };

    it('should create a new template with no properties added', async () => {
      await expect(page).toClick('a', { text: 'Templates' });
      await expect(page).toClick('a', { text: 'Add template' });
      await expect(page).toFill('input[name="template.data.name"', 'My template');
      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toClick('.alert.alert-success');
    });

    it('should go back and then edit the created template', async () => {
      await expect(page).toClick('a', { text: 'Templates' });
      await expect(page).toClick('a', { text: 'My template' });
      await expect(page).toFill('input[name="template.data.name"', 'My edited template');
      await expect(page).toClick('.panel-body > div > aside > div > ul > li:nth-child(1) > button');
      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toClick('.alert.alert-success');
    });

    it('should create a thesaurus and relationship type from the template editor', async () => {
      await createFromModal('Add thesaurus', '#thesaurusInput', 'My new dictionary');
      await createFromModal(
        'Add relationship type',
        '#relationshipTypeInput',
        'My new relationship type'
      );
    });

    it('should check that the new thesaurus and relationship are listed', async () => {
      await expect(page).toClick('a', { text: 'Thesauri' });
      await expect(page).toMatch('My new dictionary');
      await expect(page).toClick('a', { text: 'Relationship types' });
      await expect(page).toMatch('My new relationship type');
    });

    it('should use the new thesaurus and relationship type', async () => {
      await expect(page).toClick('a', { text: 'Templates' });
      await expect(page).toClick('a', { text: 'My edited template' });
      await expect(page).toClick('li.list-group-item:nth-child(3) > button:nth-child(1)');
      await expect(page).toClick(
        '.metadataTemplate-list > li:nth-child(5) > div:nth-child(1) > div:nth-child(2) > button',
        { text: 'Edit' }
      );
      await expect(page).toSelect('select.form-control:nth-child(2)', 'My new dictionary');
      await expect(page).toClick('li.list-group-item:nth-child(4) > button:nth-child(1)');
      await expect(page).toClick(
        '.metadataTemplate-list > li:nth-child(6) > div:nth-child(1) > div:nth-child(2) > button',
        { text: 'Edit' }
      );
      await expect(page).toSelect(
        'div.form-group:nth-child(2) > select:nth-child(2)',
        'My new relationship type'
      );
      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toClick('.alert.alert-success');
    });

    it('should go back to Template then delete the created template', async () => {
      await expect(page).toClick('a', { text: 'Templates' });
      await page.waitForSelector(
        '.settings-content > div > ul > li:nth-child(6) > div > button.btn.btn-danger.btn-xs.template-remove'
      );
      await expect(page).toClick(
        '.settings-content > div > ul > li:nth-child(6) > div > button.btn.btn-danger.btn-xs.template-remove'
      );
      await page.waitForSelector('div.modal-content');
      await expect(page).toMatchElement('div.modal-body > h4', {
        text: 'Confirm deletion of template: My edited template',
      });
      await expect(page).toClick('button', { text: 'Accept' });
      await expect(page).not.toMatch('My edited template');
    });
  });
});
