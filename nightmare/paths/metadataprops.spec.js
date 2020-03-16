/* eslint max-len: ["error", 500] */
/* eslint max-nested-callbacks: ["error", 10] */
import { catchErrors } from 'api/utils/jasmineHelpers';
import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import { loginAsAdminAndGoToSettings } from '../helpers/commonTests.js';

const nightmare = createNightmare();

describe('metadata properties', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  const localSelectors = {
    propertiesButtons: index =>
      `#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > aside > div > ul > li:nth-child(${index}) > button`,
    templateProperties:
      '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > aside > div > ul > li',
    relationshipPropertyType:
      '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(7) > div.propery-form.expand > div > div:nth-child(2) > select',
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

  it('should log in as admin then click the settings nav button', done => {
    loginAsAdminAndGoToSettings(nightmare, catchErrors, done);
  });

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
      .selectByLabel(localSelectors.relationshipPropertyType, 'Perpetrator')
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
      .type(localSelectors.form.richText, '*** smile ***')
      .type(localSelectors.form.linkLabel, 'Huridocs')
      .type(localSelectors.form.linkUrl, 'https://www.huridocs.org/')
      .type(localSelectors.form.image, 'test')
      .type(localSelectors.form.media, 'test')
      .insert(localSelectors.form.geolocationLat, '46')
      .insert(localSelectors.form.geolocationLon, '6')
      .click(localSelectors.form.save)
      .waitToClick('.alert.alert-success');
  });

  it('should be able to remove all the values from properties', async () => {
    await nightmare
      .waitToClick(selectors.documentView.editButton)
      .wait(localSelectors.form.text)
      .clearInput(localSelectors.form.text)
      .clearInput(localSelectors.form.numeric)
      .selectByLabel(localSelectors.form.select, 'Select other "Testing dictionary"')
      .click(localSelectors.form.multiselectOptionOne)
      .click(localSelectors.form.relationshipOptionOne)
      .click(localSelectors.form.emptyDate)
      .click(localSelectors.form.emptyDaterangeFrom)
      .click(localSelectors.form.emptyDaterangeTo)
      .click(localSelectors.form.multiDateRemoveDateTwo)
      .click(localSelectors.form.multiDateRemoveDateOne)
      .click(localSelectors.form.multidaterangeRemoveDateTwo)
      .click(localSelectors.form.multidaterangeRemoveDateOne)
      .clearInput(localSelectors.form.richText)
      .clearInput(localSelectors.form.linkLabel)
      .clearInput(localSelectors.form.linkUrl)
      .clearInput(localSelectors.form.image)
      .clearInput(localSelectors.form.media)
      .clearInput(localSelectors.form.geolocationLat)
      .clearInput(localSelectors.form.geolocationLon)
      .click(localSelectors.form.save)
      .waitToClick('.alert.alert-success');
  });
});
