import disableTransitions from '../helpers/disableTransitions';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';

describe('Metadata', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  describe('Thesauri tests', () => {
    it('should create a new thesaurus with two values', async () => {
      await expect(page).toClick('a', { text: 'Account settings' });
      await expect(page).toClick('a', { text: 'Thesauri' });
      await expect(page).toClick('a', { text: 'Add thesaurus' });
      await expect(page).toFill('input[name="thesauri.data.name"', 'New thesaurus');
      await expect(page).toFill('input[name="thesauri.data.values[0].label"', 'Value 1');
      await expect(page).toFill('input[name="thesauri.data.values[1].label"', 'Value 2');
      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toClick('.alert.alert-success');
    });

    it('should go back to thesauri then edit the created thesaurus', async () => {
      await expect(page).toClick('a', { text: 'Thesauri' });
      await expect(page).toClick(
        'div.thesauri-list > table > tbody > tr:nth-child(4) > td:nth-child(3) > div > a'
      );
      await expect(page).toClick('button', { text: 'Add group' });
      await expect(page).toFill('input[name="thesauri.data.values[2].label"', 'Group');
      await expect(page).toFill(
        'input[name="thesauri.data.values[2].values[0].label"',
        'Sub value 1'
      );
      await expect(page).toFill(
        'input[name="thesauri.data.values[2].values[1].label"',
        'Sub value 2'
      );
      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toClick('.alert.alert-success');
    });

    it('should go back to thesauri then delete the created thesaurus', async () => {
      await expect(page).toClick('a', { text: 'Thesauri' });
      await expect(page).toClick(
        '.thesauri-list > table > tbody > tr:nth-child(4) > td:nth-child(3) > div > button'
      );
      await expect(page).toMatchElement(
        'body > div:nth-child(9) > div > div > div > div.modal-body > h4',
        {
          text: 'Confirm delete thesaurus: New thesaurus',
        }
      );
      await expect(page).toClick('button', { text: 'Accept' });
    });
  });

  describe('Templates tests', () => {
    it('should click Template button and then click on add new template button', () => {});

    it('should create a new template with no properties added', () => {});

    it('should go back and then edit the created template', () => {});

    it('should go back to Template then delete the created template', () => {});
  });

  describe('Connections tests', () => {
    it('should create a new connection', () => {});

    it('should go back to Connections then edit the created connection', () => {});

    it('should go back to connections then delete the created connection', () => {});
  });
});
