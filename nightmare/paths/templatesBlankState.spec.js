/*eslint max-len: ["error", 500], */
import { catchErrors } from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';
import resetBlankState from '../helpers/resetBlankState';

import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToSettings } from '../helpers/commonTests';

const localSelectors = {
  templatesButton: '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(2) > div.list-group > a:nth-child(1)',
  createNewTemplate: '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
  templateTitle: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.metadataTemplate-heading > div > div > input',
  propertyList: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul',
};

const propertySelector = index => `#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > aside > div > ul > li:nth-child(${index}) > button`;

const nightmare = createNightmare();

describe('templates path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin then click the settings nav button', (done) => {
      loginAsAdminAndGoToSettings(nightmare, catchErrors, done);
    });
  });

  describe('Templates on blank state', () => {
    it('should create a basic template', (done) => {
      nightmare
      .waitToClick(localSelectors.templatesButton)
      .waitToClick(localSelectors.createNewTemplate)
      .write(localSelectors.templateTitle, 'Testing Document Type')
      .waitToClick(propertySelector(5))
      .getInnerText(localSelectors.propertyList)
      .then((text) => {
        expect(text).not.toContain('Relationship');
      })
      .then(() => { done(); })
      .catch(catchErrors(done));
    });

    // it('should not allow relationship properties when no relationship types exist', (done) => {
    //   console.log(localSelectors.templatesListItems);
    //   nightmare
    //     .editItemFromList(localSelectors.templatesListItems, 'Testing Document Type');
    //   console.log('PASO 2');
    //     nightmare.waitToClick(propertySelector(5)).then(() => {done();}).catch(catchErrors(done));
    // });

    // it('should edit the template and add all properties', (done) => {
    //   const numberOfProperties = 14;
    //   nightmare
    //   .editItemFromList(localSelectors.templatesListItems, 'Testing Document Type');
    //
    //   for (let i = 1; i <= numberOfProperties; i += 1) {
    //     nightmare
    //     .waitToClick(propertySelector(i));
    //   }
    //
    //   nightmare
    //   .waitToClick(editPropertySelector(textPropertyIndex))
    //   .waitToClick(hideLabelSelector(textPropertyIndex))
    //   .waitToClick(usedAsFilterSelector(textPropertyIndex))
    //   .waitToClick(editPropertySelector(relationshipPropertyIndex))
    //   .select(localSelectors.relationShipSelect, '5aae90e0bfbf88e5ae28b18c')
    //   .waitToClick(localSelectors.saveTemplate)
    //   .waitToClick('.alert.alert-success')
    //   .waitToClick(localSelectors.backbutton)
    //   .getInnerText(localSelectors.template)
    //   .then((text) => {
    //     expect(text).toContain('Testing Document Type');
    //   })
    //   .then(() => { done(); })
    //   .catch(catchErrors(done));
    // });
    //
    // it('should not allow duplicated properties', (done) => {
    //   nightmare
    //   .editItemFromList(localSelectors.templatesListItems, 'Testing Document Type')
    //   .waitToClick(editPropertySelector(textPropertyIndex))
    //   .clearInput(propertyNameSelector(textPropertyIndex))
    //   .type(propertyNameSelector(textPropertyIndex), 'Select')
    //   .waitToClick(localSelectors.saveTemplate)
    //   .waitToClick('.alert.alert-danger')
    //   .waitToClick(deletePropertySelector(textPropertyIndex))
    //   .waitToClick('div.modal-footer > button.btn.btn-danger.confirm-button')
    //   .waitToClick(localSelectors.saveTemplate)
    //   .waitToClick('.alert.alert-success')
    //   .waitToClick(localSelectors.backbutton)
    //   .getInnerText(localSelectors.template)
    //   .then((text) => {
    //     expect(text).toContain('Testing Document Type');
    //   })
    //   .then(() => { done(); })
    //   .catch(catchErrors(done));
    // });
  });
});
