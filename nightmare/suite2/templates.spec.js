/*eslint max-len: ["error", 500], */
/* eslint-disable no-await-in-loop */
import { catchErrors } from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToSettings } from '../helpers/commonTests';

const localSelectors = {
  templatesButton:
    '#app > div.content > div > div > div.settings-navigation > div > div:nth-child(2) > div.list-group > a:nth-child(1)',
  createNewTemplate:
    '#app > div.content > div > div > div.settings-content > div > div.settings-footer > a',
  templateTitle:
    '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.metadataTemplate-heading > div > div > input',
  saveTemplate:
    '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.settings-footer > button',
  backbutton:
    '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > div.settings-footer > a',
  template:
    '#app > div.content > div > div > div.settings-content > div > ul > li:nth-child(10) > a',
  templatesListItems: '#app > div.content > div > div > div.settings-content > div > ul > li',
  relationShipSelect:
    '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(8) > div.propery-form.expand > div > div:nth-child(2) > select',
  superPowersThesauriOption:
    '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(8) > div.propery-form.expand > div > div:nth-child(3) > select > option:nth-child(12)',
};

const propertySelector = index =>
  `#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > aside > div > ul > li:nth-child(${index}) > button`;
const editPropertySelector = index =>
  `#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(${index}) > div  button.btn.btn-default.btn-xs.property-edit`;
const hideLabelSelector = index =>
  `#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(${index}) > div.propery-form.expand > div > div:nth-child(2) > div:nth-child(1) > label`;
const usedAsFilterSelector = index =>
  `#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(${index}) > div.propery-form.expand > div > div:nth-child(2) > div.inline-group > div > label`;
const propertyNameSelector = index =>
  `#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(${index}) > div.propery-form.expand > div > div.form-group > div > input`;
const deletePropertySelector = index =>
  `#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(${index}) div > button.btn.btn-danger.btn-xs.property-remove`;
const textPropertyIndex = 4;
const relationshipPropertyIndex = 8;

const nightmare = createNightmare();

describe('templates path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin then click the settings nav button', done => {
      loginAsAdminAndGoToSettings(nightmare, catchErrors, done);
    });
  });

  describe('Templates', () => {
    it('should create a basic template', done => {
      nightmare
        .waitToClick(localSelectors.templatesButton)
        .waitToClick(localSelectors.createNewTemplate)
        .write(localSelectors.templateTitle, 'Testing Document Type')
        .waitToClick(localSelectors.saveTemplate)
        .waitToClick('.alert.alert-success')
        .waitToClick(localSelectors.backbutton)
        .getInnerText(localSelectors.template)
        .then(text => {
          expect(text).toContain('Testing Document Type');
        })
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });

    it('should edit the template and add all properties', async () => {
      const numberOfProperties = 14;
      nightmare.editItemFromList(localSelectors.templatesListItems, 'Testing Document Type');

      for (let i = 1; i <= numberOfProperties; i += 1) {
        await nightmare.waitToClick(propertySelector(i));
      }

      const templateName = await nightmare
        .waitToClick(editPropertySelector(textPropertyIndex))
        .waitToClick(hideLabelSelector(textPropertyIndex))
        .waitToClick(usedAsFilterSelector(textPropertyIndex))
        .waitToClick(editPropertySelector(relationshipPropertyIndex))
        .select(localSelectors.relationShipSelect, '5aae90e0bfbf88e5ae28b18c')
        .waitToClick(localSelectors.saveTemplate)
        .waitToClick('.alert.alert-success')
        .waitToClick(localSelectors.backbutton)
        .getInnerText(localSelectors.template);

      expect(templateName).toContain('Testing Document Type');
    });

    it('should not allow duplicated properties', done => {
      nightmare
        .editItemFromList(localSelectors.templatesListItems, 'Testing Document Type')
        .waitToClick(editPropertySelector(textPropertyIndex))
        .clearInput(propertyNameSelector(textPropertyIndex))
        .type(propertyNameSelector(textPropertyIndex), 'Select')
        .waitToClick(localSelectors.saveTemplate)
        .waitToClick('.alert.alert-danger')
        .waitToClick(deletePropertySelector(textPropertyIndex))
        .waitToClick('div.modal-footer > button.btn.btn-danger.confirm-button')
        .waitToClick(localSelectors.saveTemplate)
        .waitToClick('.alert.alert-success')
        .waitToClick(localSelectors.backbutton)
        .getInnerText(localSelectors.template)
        .then(text => {
          expect(text).toContain('Testing Document Type');
        })
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
