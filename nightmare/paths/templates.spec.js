/*eslint max-len: ["error", 500], */
import { catchErrors } from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';
import config from '../helpers/config.js';
import selectors from '../helpers/selectors.js';
import insertFixtures from '../helpers/insertFixtures';

const localSelectors = {
  templatesButton: '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(2) > div.list-group > a:nth-child(1)',
  createNewTemplate: '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
  templateTitle: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.metadataTemplate-heading > div > div > input',
  saveTemplate: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.settings-footer > button',
  backbutton: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.settings-footer > a',
  template: '#app > div.content > div > div > div.settings-content > div > ul > li:nth-child(6) > a',
  templatesListItems: '#app > div.content > div > div > div.settings-content > div > ul > li',
  editRelationShipProperty: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(7) > div > button.btn.btn-default.btn-xs.property-edit',
  relationShipSelect: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(7) > div.propery-form.expand > div > div:nth-child(3) > select',
  superPowersThesauriOption: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(7) > div.propery-form.expand > div > div:nth-child(3) > select > option:nth-child(12)'
};

const propertySelector = index => `#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > aside > div > ul > li:nth-child(${index}) > button`;

const nightmare = createNightmare();

describe('templates path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin then click the settings nav button', (done) => {
      nightmare
      .login('admin', 'admin')
      .waitToClick(selectors.navigation.settingsNavButton)
      .wait(selectors.settingsView.settingsHeader)
      .url()
      .then((url) => {
        expect(url).toBe(`${config.url}/settings/account`);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('Templates', () => {
    it('should create a basic template', (done) => {
      nightmare
      .waitToClick(localSelectors.templatesButton)
      .waitToClick(localSelectors.createNewTemplate)
      .write(localSelectors.templateTitle, 'Testing Document Type')
      .waitToClick(localSelectors.saveTemplate)
      .waitToClick('.alert.alert-success')
      .waitToClick(localSelectors.backbutton)
      .getInnerText(localSelectors.template)
      .then((text) => {
        expect(text).toContain('Testing Document Type');
      })
      .then(() => { done(); })
      .catch(catchErrors(done));
    });

    it('should edit the template and add all properties', (done) => {
      const numberOfProperties = 14;
      nightmare
      .editItemFromList(localSelectors.templatesListItems, 'Testing Document Type');

      for (let i = 1; i <= numberOfProperties; i += 1) {
        nightmare
        .waitToClick(propertySelector(i));
      }

      nightmare
      .waitToClick(localSelectors.editRelationShipProperty)
      .select(localSelectors.relationShipSelect, '5aae90e0bfbf88e5ae28b18c')
      .waitToClick(localSelectors.saveTemplate)
      .waitToClick('.alert.alert-success')
      .waitToClick(localSelectors.backbutton)
      .getInnerText(localSelectors.template)
      .then((text) => {
        expect(text).toContain('Testing Document Type');
      })
      .then(() => { done(); })
      .catch(catchErrors(done));
    });
  });
});
