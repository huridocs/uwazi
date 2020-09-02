/* eslint-disable max-lines */
/* eslint max-len: ["error", 500] */
/* eslint max-nested-callbacks: ["error", 10] */
/* eslint-disable no-await-in-loop */
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
    viewer:
      '#app > div.content > div > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div.view',
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
      date:
        '#metadataForm > div:nth-child(3) > div:nth-child(6) > ul > li.wide > div.react-datepicker-wrapper > div > input',

      emptyDate:
        '#metadataForm > div:nth-child(3) > div:nth-child(6) > ul > li.wide > div > div > button',
      dateRangeFrom:
        '#metadataForm > div:nth-child(3) > div:nth-child(7) > ul > li.wide > div > div.DatePicker__From > div > div > input',
      dateRangeTo:
        '#metadataForm > div:nth-child(3) > div:nth-child(7) > ul > li.wide > div > div.DatePicker__To > div > div > input',
      emptyDaterangeFrom:
        '#metadataForm > div:nth-child(3) > div:nth-child(7) > ul > li.wide > div > div.DatePicker__From > div > div > button',
      emptyDaterangeTo:
        '#metadataForm > div:nth-child(3) > div:nth-child(7) > ul > li.wide > div > div.DatePicker__To > div > div > button',
      multidateInputOne:
        '#metadataForm > div:nth-child(3) > div:nth-child(8) > ul > li.wide > div > div:nth-child(1) > div.react-datepicker-wrapper > div > input',
      multidateInputTwo:
        '#metadataForm > div:nth-child(3) > div:nth-child(8) > ul > li.wide > div > div:nth-child(2) > div > div > input',
      multiDateRemoveDateOne:
        '#metadataForm > div:nth-child(3) > div:nth-child(8) > ul > li.wide > div > div:nth-child(1) > button',
      multiDateRemoveDateTwo:
        '#metadataForm > div:nth-child(3) > div:nth-child(8) > ul > li.wide > div > div:nth-child(2) > button',
      multidateAddDateButton:
        '#metadataForm > div:nth-child(3) > div:nth-child(8) > ul > li.wide > div > button',
      multidaterangeAddButton:
        '#metadataForm > div:nth-child(3) > div:nth-child(9) > ul > li.wide > div > button',
      multidaterangeFromInputOne:
        '#metadataForm > div:nth-child(3) > div:nth-child(9) > ul > li.wide > div > div:nth-child(1) > div > div.DatePicker__From > div > div > input',
      multidaterangeToInputOne:
        '#metadataForm > div:nth-child(3) > div:nth-child(9) > ul > li.wide > div > div:nth-child(1) > div > div.DatePicker__To > div > div > input',
      multidaterangeFromInputTwo:
        '#metadataForm > div:nth-child(3) > div:nth-child(9) > ul > li.wide > div > div:nth-child(2) > div > div.DatePicker__From > div > div > input',
      multidaterangeToInputTwo:
        '#metadataForm > div:nth-child(3) > div:nth-child(9) > ul > li.wide > div > div:nth-child(2) > div > div.DatePicker__To > div > div > input',
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
        '#app > div.content > div > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-footer > span > button.btn.btn-success',
    },
    properties: {
      text: '.metadata-type-text dd',
      numeric: '.metadata-type-numeric dd',
      select: '.metadata-type-select dd',
      multiselect: '.metadata-type-multiselect dd',
      relationship: '.metadata-type-relationship dd',
      date: '.metadata-type-date dd',
      daterange: '.metadata-type-daterange dd',
      multidate: '.metadata-type-multidate dd',
      multidaterange: '.metadata-type-multidaterange dd',
      markdown: '.metadata-type-markdown dd',
      link: '.metadata-type-link dd',
      image: '.metadata-type-multimedia img',
      media: '.metadata-type-multimedia:nth-child(14) .react-player',
      geolocation: '.metadata-type-geolocation .map-container',
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
      fail('amount of props have change, update this path');
    }
  });

  it('should create a template with all the properties', async () => {
    await nightmare
      .waitToClick(selectors.settingsView.templatesButton)
      .waitToClick(selectors.settingsView.addNewTemplate)
      .write(selectors.settingsView.documentTemplateNameForm, 'All props');

    //intentionaly leaving the geolocation field out of the test.
    for (let propIndex = 1; propIndex <= 14; propIndex += 1) {
      await nightmare.waitToClick(localSelectors.propertiesButtons(propIndex));
    }

    await nightmare
      .waitToClick(localSelectors.editRelationshipProperty)
      .wait(localSelectors.relationshipPropertyType)
      .selectByLabel(localSelectors.relationshipPropertyType, 'Perpetrator')
      .waitToClick(selectors.settingsView.saveTemplateButton)
      .waitToClick('.alert.alert-success');
  });

  it('should create an entity filling all the props', async () => {
    await nightmare
      .waitToClick(selectors.navigation.uploadsNavButton)
      .waitToClick(selectors.uploadsView.newEntityButtom)
      .write(selectors.newEntity.form.title, 'Entity with all props')
      .selectByLabel(selectors.newEntity.form.type, 'All props')
      .wait(localSelectors.form.text)
      .write(localSelectors.form.text, 'demo text')
      .write(localSelectors.form.numeric, '42')
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
      .write(localSelectors.form.richText, '***smile***')
      .write(localSelectors.form.linkLabel, 'Huridocs')
      .write(localSelectors.form.linkUrl, 'https://www.huridocs.org/')
      .write(localSelectors.form.image, '/public/logo.svg')
      .write(localSelectors.form.media, 'test')
      .click(localSelectors.form.save)
      .waitToClick('.alert.alert-success');
  }, 60000);

  it('should have all the values corretly saved', async () => {
    await nightmare
      .getInnerText(localSelectors.properties.text)
      .then(text => {
        expect(text).toBe('demo text');
        return nightmare.getInnerText(localSelectors.properties.numeric);
      })
      .then(numeric => {
        expect(numeric).toBe('42');
        return nightmare.getInnerText(localSelectors.properties.select);
      })
      .then(select => {
        expect(select).toBe('This');
        return nightmare.getInnerText(localSelectors.properties.multiselect);
      })
      .then(multiselect => {
        expect(multiselect).toBe('This\n');
        return nightmare.getInnerText(localSelectors.properties.relationship);
      })
      .then(relationship => {
        expect(relationship).toBe('Ace the Bat Hound Wikipedia\n');
        return nightmare.getInnerText(localSelectors.properties.date);
      })
      .then(date => {
        expect(date).toBe('Sep 8, 1966');
        return nightmare.getInnerText(localSelectors.properties.daterange);
      })
      .then(daterange => {
        expect(daterange).toBe('Nov 23, 1963 ~ Sep 12, 1964');
        return nightmare.getInnerText(localSelectors.properties.multidate);
      })
      .then(multidate => {
        expect(multidate).toBe('Nov 23, 1963\nSep 12, 1964\n');
        return nightmare.getInnerText(localSelectors.properties.multidaterange);
      })
      .then(multidaterange => {
        expect(multidaterange).toBe('Nov 23, 1963 ~ Sep 12, 1964\nNov 23, 1963 ~ Sep 12, 1964\n');
        return nightmare.getInnerText(localSelectors.properties.markdown);
      })
      .then(markdown => {
        expect(markdown).toBe('smile\n\n');
        return nightmare.getInnerText(localSelectors.properties.link);
      })
      .then(text => {
        expect(text).toBe('Huridocs');
        return nightmare
          .wait(localSelectors.properties.image)
          .wait(localSelectors.properties.media);
      });
  }, 60000);

  it('should be able to remove all the values from properties', async () => {
    await nightmare
      .waitToClick(selectors.libraryView.editEntityButton)
      .wait(localSelectors.form.text)
      .clearInput(localSelectors.form.text)
      .clearInput(localSelectors.form.numeric)
      .selectByLabel(localSelectors.form.select, 'Select...')
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
      .click(localSelectors.form.save)
      .waitToClick('.alert.alert-success');
  }, 60000);

  it('should have not metadata', async () => {
    await nightmare.getInnerText(localSelectors.viewer).then(metadata => {
      expect(metadata).toBe('Entity with all props\nAll props\n');
    });
  });
});
