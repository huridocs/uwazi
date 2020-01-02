/*eslint max-len: ["error", 500], */
import { catchErrors } from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';

import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToSettings } from '../helpers/commonTests';

const localSelectors = {
  templatesButton: '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(2) > div.list-group > a:nth-child(1)',
  createNewTemplate: '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
  templateTitle: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.metadataTemplate-heading > div > div > input',
  propertyList: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul',
  relationshipProperty: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > aside > div > ul > li:nth-child(5) > button',
};

const nightmare = createNightmare();

describe('templates path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin then click the settings nav button', (done) => {
      loginAsAdminAndGoToSettings(nightmare, catchErrors, done);
    });
  });

  describe('Templates without existent relationship types', () => {
    it('should not allow to add a relationship field', (done) => {
      nightmare
      .waitToClick(localSelectors.templatesButton)
      .waitToClick(localSelectors.createNewTemplate)
      .write(localSelectors.templateTitle, 'Testing Document Type')
      .waitToClick(localSelectors.relationshipProperty)
      .getInnerText(localSelectors.propertyList)
      .then((text) => {
        expect(text).not.toContain('Relationship');
      })
      .then(() => { done(); })
      .catch(catchErrors(done));
    });
  });
});
