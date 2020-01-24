/**
 * /*eslint max-nested-callbacks: ["error", 10]
 *
 * @format
 */

import { catchErrors } from 'api/utils/jasmineHelpers';
import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToSettings } from '../helpers/commonTests.js';

const nightmare = createNightmare();

describe('metadata path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  fdescribe('login', () => {
    it('should log in as admin then click the settings nav button', done => {
      loginAsAdminAndGoToSettings(nightmare, catchErrors, done);
    });
  });

  describe('Dictionaries tests', () => {
    it('should click dictionaries button and then click on add new dictionary button', done => {
      nightmare
        .waitToClick(selectors.settingsView.dictionariesButton)
        .waitToClick(selectors.settingsView.addNewDictionary)
        .wait(selectors.settingsView.saveDictionaryButton)
        .isVisible(selectors.settingsView.saveDictionaryButton)
        .then(result => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should create a new dictionary with two values', done => {
      nightmare
        .write(selectors.settingsView.dictionaryNameForm, 'test dictionary 2')
        .write(selectors.settingsView.firstDictionaryValForm, 'tests value 1')
        .write(selectors.settingsView.secondDictionaryValForm, 'tests value 2')
        .waitToClick(selectors.settingsView.saveDictionaryButton)
        .waitToClick('.alert.alert-success')
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });

    it('should go back to dictionaries then edit the created dictionary', done => {
      nightmare
        .waitToClick(selectors.settingsView.dictionariesBackButton)
        .wait(selectors.settingsView.tableElementsOfSection)
        .editItemFromList(selectors.settingsView.tableElementsOfSection, 'test')
        .write(selectors.settingsView.dictionaryNameForm, 'edited')
        .waitToClick(selectors.settingsView.saveDictionaryButton)
        .waitToClick('.alert.alert-success')
        .write(selectors.settingsView.firstDictionaryValForm, 'edited')
        .waitToClick(selectors.settingsView.saveDictionaryButton)
        .waitToClick('.alert.alert-success')
        .write(selectors.settingsView.secondDictionaryValForm, 'edited')
        .waitToClick(selectors.settingsView.saveDictionaryButton)
        .waitToClick('.alert.alert-success')
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });

    it('should go back to dictionaries then delete the created dictionary', done => {
      nightmare
        .waitToClick(selectors.settingsView.dictionariesBackButton)
        .deleteItemFromList(selectors.settingsView.tableElementsOfSection, 'edited')
        .waitToClick(selectors.settingsView.deleteButtonConfirmation)
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('Templates tests', () => {
    it('should click Documents button and then click on add new document button', done => {
      nightmare
        .waitToClick(selectors.settingsView.templatesButton)
        .waitToClick(selectors.settingsView.addNewDocument)
        .wait(selectors.settingsView.saveTemplateButton)
        .isVisible(selectors.settingsView.saveTemplateButton)
        .then(result => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should create a new template with no properties added', done => {
      nightmare
        .write(selectors.settingsView.documentTemplateNameForm, 'new document')
        .waitToClick(selectors.settingsView.saveTemplateButton)
        .waitToClick('.alert.alert-success')
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });

    it('should go back and then edit the created template', done => {
      nightmare
        .waitToClick(selectors.settingsView.documentsBackButton)
        .wait(selectors.settingsView.liElementsOfSection)
        .editItemFromList(selectors.settingsView.liElementsOfSection, 'new')
        .clearInput(selectors.settingsView.documentTemplateNameForm)
        .write(selectors.settingsView.documentTemplateNameForm, 'edited')
        .waitToClick(selectors.settingsView.saveEntityButton)
        .waitToClick('.alert.alert-success')
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });

    it('should go back to Documents then delete the created document template', done => {
      nightmare
        .waitToClick(selectors.settingsView.documentsBackButton)
        .deleteItemFromList(selectors.settingsView.liElementsOfSection, 'edited')
        .waitToClick(selectors.settingsView.deleteButtonConfirmation)
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('Connections tests', () => {
    it('should click Connections button and then click on add new connection button', done => {
      nightmare
        .waitToClick(selectors.settingsView.connectionsButton)
        .waitToClick(selectors.settingsView.addNewConnection)
        .wait(selectors.settingsView.saveConnectionButton)
        .isVisible(selectors.settingsView.saveConnectionButton)
        .then(result => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should create a new connection', done => {
      nightmare
        .write(selectors.settingsView.connectionNameForm, 'test connection')
        .waitToClick(selectors.settingsView.saveConnectionButton)
        .waitToClick('.alert.alert-success')
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });

    it('should go back to Connections then edit the created connection', done => {
      nightmare
        .waitToClick(selectors.settingsView.connectionsBackButton)
        .wait(selectors.settingsView.liElementsOfSection)
        .wait(500)
        .editItemFromList(selectors.settingsView.liElementsOfSection, 'test')
        .clearInput(selectors.settingsView.connectionNameForm)
        .write(selectors.settingsView.connectionNameForm, 'edited')
        .waitToClick(selectors.settingsView.saveConnectionButton)
        .waitToClick('.alert.alert-success')
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });

    it('should go back to connections then delete the created connection', done => {
      nightmare
        .waitToClick(selectors.settingsView.connectionsBackButton)
        .wait(selectors.settingsView.liElementsOfSection)
        .deleteItemFromList(selectors.settingsView.liElementsOfSection, 'edited')
        .waitToClick(selectors.settingsView.deleteButtonConfirmation)
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('Entities tests', () => {
    it('should click Entities button and then click on add new Entity button', done => {
      nightmare
        .waitToClick(selectors.settingsView.templatesButton)
        .waitToClick(selectors.settingsView.addNewTemplate)
        .wait(selectors.settingsView.saveEntityButton)
        .isVisible(selectors.settingsView.saveEntityButton)
        .then(result => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should create a new entity', done => {
      nightmare
        .write(selectors.settingsView.entityNameForm, 'e2e test entity')
        .click(selectors.settingsView.saveEntityButton)
        .waitToClick('.alert.alert-success')
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });

    it('should go back to Entities then edit the created entity', done => {
      nightmare
        .waitToClick(selectors.settingsView.entitiesBackButton)
        .wait(selectors.settingsView.liElementsOfSection)
        .editItemFromList(selectors.settingsView.liElementsOfSection, 'e2e')
        .clearInput(selectors.settingsView.entityNameForm)
        .write(selectors.settingsView.entityNameForm, 'edited')
        .waitToClick(selectors.settingsView.saveEntityButton)
        .waitToClick('.alert.alert-success')
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });

    it('should go back to Entities then delete the created entity', done => {
      nightmare
        .waitToClick(selectors.settingsView.entitiesBackButton)
        .wait(selectors.settingsView.liElementsOfSection)
        .deleteItemFromList(selectors.settingsView.liElementsOfSection, 'edited')
        .waitToClick(selectors.settingsView.deleteButtonConfirmation)
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });
  });

  fdescribe('Properties', () => {
    const localSelectors = {
      propertiesButtons: index =>
        `#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > aside > div > ul > li:nth-child(${index}) > button`,
      templateProperties:
        '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > aside > div > ul > li',
      relationshipPropertyType:
        '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(7) > div.propery-form.expand > div > div:nth-child(2) > select',
      relationshipPropertyEntity:
        '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(7) > div.propery-form.expand > div > div:nth-child(3) > select > option:nth-child(2)',
      editRelationshipProperty:
        '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(7) > div.list-group-item > div > button.btn.btn-default.btn-xs.property-edit',
      form: {
        text: '#metadataForm > div:nth-child(3) > div:nth-child(1) > ul > li.wide > div > input',
        numeric: '#metadataForm > div:nth-child(3) > div:nth-child(2) > ul > li.wide > input',
        select: '#metadataForm > div:nth-child(3) > div:nth-child(3) > ul > li.wide > select',
        multiselectOptionOne:
          '#metadataForm > div:nth-child(3) > div:nth-child(4) > ul > li.wide > ul > li:nth-child(2) > label',
        relationshipOptionOne:
          '#metadataForm > div:nth-child(3) > div:nth-child(5) > ul > li.wide > ul > li:nth-child(2) > label',
        date: '#metadataForm > div:nth-child(3) > div:nth-child(6) > ul > li.wide > div > input',
        emptyDate: '#metadataForm > div:nth-child(3) > div:nth-child(6) > ul > li.wide > div > a',
        dateRangeFrom:
          '#metadataForm > div:nth-child(3) > div:nth-child(7) > ul > li.wide > div > div.DatePicker__From > div > input',
        dateRangeTo:
          '#metadataForm > div:nth-child(3) > div:nth-child(7) > ul > li.wide > div > div.DatePicker__To > div > input',
        emptyDaterangeFrom:
          '#metadataForm > div:nth-child(3) > div:nth-child(7) > ul > li.wide > div > div.DatePicker__From > div > a',
        emptyDaterangeTo:
          '#metadataForm > div:nth-child(3) > div:nth-child(7) > ul > li.wide > div > div.DatePicker__To > div > a',
        multidateInputOne:
          '#metadataForm > div:nth-child(3) > div:nth-child(8) > ul > li.wide > div > div:nth-child(1) > div > input',
        multidateInputTwo:
          '#metadataForm > div:nth-child(3) > div:nth-child(8) > ul > li.wide > div > div:nth-child(2) > div > input',
        multiDateRemoveDateOne:
          '#metadataForm > div:nth-child(3) > div:nth-child(8) > ul > li.wide > div > div:nth-child(1) > button',
        multiDateRemoveDateTwo:
          '#metadataForm > div:nth-child(3) > div:nth-child(8) > ul > li.wide > div > div:nth-child(2) > button',
        multidateAddDateButton:
          '#metadataForm > div:nth-child(3) > div:nth-child(8) > ul > li.wide > div > button',
        multidaterangeAddButton:
          '#metadataForm > div:nth-child(3) > div:nth-child(9) > ul > li.wide > div > button',
        multidaterangeFromInputOne:
          '#metadataForm > div:nth-child(3) > div:nth-child(9) > ul > li.wide > div > div:nth-child(1) > div > div.DatePicker__From > div > input',
        multidaterangeToInputOne:
          '#metadataForm > div:nth-child(3) > div:nth-child(9) > ul > li.wide > div > div:nth-child(1) > div > div.DatePicker__To > div > input',
        multidaterangeFromInputTwo:
          '#metadataForm > div:nth-child(3) > div:nth-child(9) > ul > li.wide > div > div:nth-child(2) > div > div.DatePicker__From > div > input',
        multidaterangeToInputTwo:
          '#metadataForm > div:nth-child(3) > div:nth-child(9) > ul > li.wide > div > div:nth-child(2) > div > div.DatePicker__To > div > input',
        multidaterangeRemoveDateOne:
          '#metadataForm > div:nth-child(3) > div:nth-child(9) > ul > li.wide > div > div:nth-child(1) > div > button',
        multidaterangeRemoveDateTwo:
          '#metadataForm > div:nth-child(3) > div:nth-child(9) > ul > li.wide > div > div:nth-child(2) > div > button',
        richText:
          '#metadataForm > div:nth-child(3) > div:nth-child(10) > ul > li.wide > div > div.tab-content.tab-content-visible > textarea',
        linkLabel:
          '#metadataForm > div:nth-child(3) > div:nth-child(11) > ul > li.wide > div > div > div:nth-child(1) > input',
        linkUrl:
          '#metadataForm > div:nth-child(3) > div:nth-child(11) > ul > li.wide > div > div > div:nth-child(2) > input',
        image:
          '#metadataForm > div:nth-child(3) > div:nth-child(12) > ul > li.wide > div > div > textarea',
        media:
          '#metadataForm > div:nth-child(3) > div:nth-child(14) > ul > li.wide > div > div > textarea',
        geolocationLat:
          '#metadataForm > div:nth-child(3) > div:nth-child(15) > ul > li.wide > div > div.form-row > div:nth-child(1) > input',
        geolocationLon:
          '#metadataForm > div:nth-child(3) > div:nth-child(15) > ul > li.wide > div > div.form-row > div:nth-child(2) > input',
        save:
          '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-footer > span > button.btn.btn-success',
      },
    };

    it('should test all the properties', async () => {
      await nightmare
        .waitToClick(selectors.settingsView.templatesButton)
        .waitToClick(selectors.settingsView.addNewTemplate);

      const numberOfProps = await nightmare.evaluate(
        selector => document.querySelectorAll(selector).length,
        localSelectors.templateProperties
      );

      if (numberOfProps !== 15) {
        fail('amount of props have change, update this test');
      }
    });

    it('should create a template with all the properties', async () => {
      await nightmare
        .waitToClick(selectors.settingsView.templatesButton)
        .waitToClick(selectors.settingsView.addNewTemplate)
        .write(selectors.settingsView.documentTemplateNameForm, 'All props');

      for (let propIndex = 1; propIndex <= 15; propIndex += 1) {
        await nightmare.waitToClick(localSelectors.propertiesButtons(propIndex));
      }

      await nightmare
        .waitToClick(localSelectors.editRelationshipProperty)
        .select(localSelectors.relationshipPropertyType, '5a8480eac464318833d9b54e')
        .select(localSelectors.relationshipPropertyEntity, '58ad7d240d44252fee4e61fd')
        .waitToClick(selectors.settingsView.saveTemplateButton)
        .waitToClick('.alert.alert-success');
    });

    it('should create an entity filling all the props', async () => {
      await nightmare
        .waitToClick(selectors.navigation.uploadsNavButton)
        .waitToClick(selectors.uploadsView.newEntityButtom)
        .type(selectors.newEntity.form.title, 'Entity with all props')
        .selectByLabel(selectors.newEntity.form.type, 'All props')
        .wait(localSelectors.form.text)
        .type(localSelectors.form.text, 'demo text')
        .type(localSelectors.form.numeric, '42')
        .selectByLabel(localSelectors.form.select, 'This')
        .click(localSelectors.form.multiselectOptionOne)
        .click(localSelectors.form.relationshipOptionOne)
        .selectDate(localSelectors.form.date, '08/09/1966')
        .selectDate(localSelectors.form.dateRangeFrom, '23/11/1963')
        .selectDate(localSelectors.form.dateRangeTo, '12/09/1964')
        .click(localSelectors.form.multidateAddDateButton)
        .selectDate(localSelectors.form.multidateInputOne, '23/11/1963')
        .selectDate(localSelectors.form.multidateInputTwo, '12/09/1964')
        .click(localSelectors.form.multidaterangeAddButton)
        .selectDate(localSelectors.form.multidaterangeFromInputOne, '23/11/1963')
        .selectDate(localSelectors.form.multidaterangeToInputOne, '12/09/1964')
        .selectDate(localSelectors.form.multidaterangeFromInputTwo, '23/11/1963')
        .selectDate(localSelectors.form.multidaterangeToInputTwo, '12/09/1964')
        .type(
          localSelectors.form.richText,
          '"There is a fine line between consideration and hesitation. The former is wisdom, the latter is fear." -- Emperor Izaro Phrecius'
        )
        .type(localSelectors.form.linkLabel, 'Huridocs')
        .type(localSelectors.form.linkUrl, 'https://www.huridocs.org/')
        .type(localSelectors.form.image, 'test')
        .type(localSelectors.form.media, 'test')
        .type(localSelectors.form.geolocationLat, '46,220768752727636')
        .type(localSelectors.form.geolocationLon, '6,139087708189891')
        .click(localSelectors.form.save)
        .waitToClick('.alert.alert-success');
    });

    it('should be able to remove all the values from properties', async () => {
      await nightmare
        .waitToClick(selectors.documentView.editButton)
        .wait(localSelectors.form.text)
        .type(localSelectors.form.text)
        .type(localSelectors.form.numeric)
        .selectByLabel(localSelectors.form.select, 'This')
        .click(localSelectors.form.multiselectOptionOne)
        .click(localSelectors.form.relationshipOptionOne)
        .click(localSelectors.form.emptyDate)
        .click(localSelectors.form.emptyDaterangeFrom)
        .click(localSelectors.form.emptyDaterangeTo)
        .click(localSelectors.form.multiDateRemoveDateTwo)
        .click(localSelectors.form.multiDateRemoveDateOne)
        .click(localSelectors.form.multidaterangeRemoveDateTwo)
        .click(localSelectors.form.multidaterangeRemoveDateOne)
        .type(localSelectors.form.richText)
        .type(localSelectors.form.linkLabel)
        .type(localSelectors.form.linkUrl)
        .type(localSelectors.form.image)
        .type(localSelectors.form.media)
        .type(localSelectors.form.geolocationLat)
        .type(localSelectors.form.geolocationLon)
        .click(localSelectors.form.save)
        .waitToClick('.alert.alert-success');
    });
  });
});
