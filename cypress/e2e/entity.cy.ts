import { clearCookiesAndLogin } from './helpers/login';
import { changeLanguage, clickOnEditEntity, saveEntity } from './helpers';

const entityTitle = 'Entity with all props';
const textWithHtml = `<h1>The title</h1>
  <a href="https://duckduckgo.com/" target="_blank">
    I am a link to an external site
  </a>
  <br />
  <a href="/entity/6z2x77oi2yyqr529">
    I am a link to the Tracy Robinson entity
  <a/>
  <ol class="someClass">
    <li>List item 1</li>
    <li>List item 2</li>
  </ol>`;

const clickMediaAction = (field: string, action: string) => {
  cy.contains(`.form-group.${field.toLowerCase()}`, field).contains('button', action).focus();
  cy.contains(`.form-group.${field.toLowerCase()}`, field)
    .contains('button', action)
    .click({ force: true });
};

const addVideo = (action: string, local: boolean = true) => {
  if (action) {
    clickMediaAction('Media', action);
  }
  cy.contains('Select from computer');
  if (local) {
    cy.get('.upload-button input[type=file]')
      .last()
      .selectFile('./cypress/test_files/short-video.mp4', {
        force: true,
      });
  } else {
    cy.get('input[name="urlForm.url"]').type(
      'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      { delay: 0 }
    );
    cy.contains('button', 'Add from URL').click();
  }

  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
  cy.contains('.form-group.media', 'Media').scrollIntoView();
  cy.contains('.form-group.media', 'Media').within(() => {
    cy.get('video').should('be.visible');
  });
};

const addImage = () => {
  clickMediaAction('Image', 'Add file');
  cy.contains('button', 'Select from computer');
  cy.get('.upload-button input[type=file]').first().selectFile('./cypress/test_files/batman.jpg', {
    force: true,
  });
  // wait for image
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(200);
  cy.contains('.form-group.image', 'Image').scrollIntoView();
  cy.contains('.form-group.image', 'Image').within(() => {
    cy.get('img').should('be.visible');
  });
};

const addInvalidVideoFile = (field: string) => {
  cy.contains(`.form-group.${field.toLowerCase()}`, field).contains('button', 'Add file').click();
  cy.contains('button', 'Select from computer');
  cy.get('.upload-button input[type=file]').first().selectFile('./cypress/test_files/sample.pdf', {
    force: true,
  });
  cy.contains(field)
    .parentsUntil('.form-group')
    .contains('This file type is not supported on media fields')
    .scrollIntoView();
  cy.contains(field)
    .parentsUntil('.form-group')
    .contains('This file type is not supported on media fields')
    .should('be.visible');
};

const addInvalidImageFile = (field: string) => {
  cy.contains(`.form-group.${field.toLowerCase()}`, field).contains('button', 'Add file').click();
  cy.contains('button', 'Select from computer');
  cy.get('.upload-button input[type=file]').first().selectFile('./cypress/test_files/sample.pdf', {
    force: true,
  });
  cy.contains(field)
    .parentsUntil('.form-group')
    .contains('Error loading your image')
    .scrollIntoView();
  cy.contains(field)
    .parentsUntil('.form-group')
    .contains('Error loading your image')
    .should('be.visible');
};

const checkMediaSnapshots = (selector: string, options = {}) => {
  cy.get(selector).scrollIntoView({ offset: { top: -30, left: 0 } });
  cy.get(selector).toMatchImageSnapshot({
    ...options,
    disableTimersAndAnimations: true,
    threshold: 0.08,
  });
};

const checkExternalMedia = () => {
  cy.get('video').should(
    'have.attr',
    'src',
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  );
};

describe('Entities', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
    cy.intercept('GET', 'api/files/*').as('getFile');
  });

  describe('Template Medatada', () => {
    it('should log in as admin then click the settings nav button.', () => {
      cy.contains('a', 'Settings').click();
      cy.url().should('include', '/en/settings/account');
    });

    it('should test number of available properties.', () => {
      cy.get('a').contains('Templates').click();
      cy.get('a').contains('Add template').click();
      cy.get('.property-options-list li').should('have.length', 13);
    });

    it('should create a template with all the properties', () => {
      cy.get('a').contains('Templates').click();
      cy.get('a').contains('Add template').click();
      cy.get('input[name="template.data.name"]').type('All props', { delay: 0 });

      cy.get('.property-options-list li button').each(($btn, index) => {
        //intentionaly leaving the last fields out of the test: violated articles (nested), generated id.
        if (index < 11) {
          cy.wrap($btn).click();
        }
      });
      cy.contains('.metadataTemplate span', /^Date$/)
        .siblings()
        .contains('button', 'Edit')
        .click();
      cy.clearAndType('#property-label', 'Single Date', { delay: 0 });

      cy.contains('.metadataTemplate span', 'Relationship')
        .siblings()
        .contains('button', 'Edit')
        .click();
      cy.contains('Any entity or document');
      cy.contains('.metadataTemplate', 'Relationship').get('select').eq(1).select(1);
      cy.contains('span', 'Media').siblings().contains('button', 'Edit').click();
      cy.contains('span', 'Show in cards').click();
    });

    it('should add another select of type multiselect', () => {
      cy.get('li.list-group-item:nth-child(3) > button:nth-child(1)').click();
      cy.get(
        '.metadataTemplate-list > li:nth-child(15) > div:nth-child(1) > div:nth-child(2) > button'
      )
        .contains('Edit')
        .click();
      cy.clearAndType('#property-label', 'Multiselect', { delay: 0 });
      cy.get('#property-type').select('Multiple select');
    });

    it('should add multidate, date range and multidate range', () => {
      for (let index = 0; index < 4; index += 1) {
        cy.get('li.list-group-item:nth-child(5) > button:nth-child(1)').click();
      }

      cy.get('.metadataTemplate-list > li:nth-child(10)').scrollIntoView();
      cy.contains('.metadataTemplate-list > li:nth-child(16) span', 'Date').scrollIntoView();
      cy.contains('.metadataTemplate-list > li:nth-child(16) span', 'Date')
        .siblings()
        .contains('button', 'Edit')
        .click();
      cy.clearAndType('#property-label', 'Multi Date', { delay: 0 });
      cy.get('#property-type').select('Multiple date');

      cy.contains('.metadataTemplate-list > li:nth-child(17) span', 'Date')
        .siblings()
        .contains('button', 'Edit')
        .click();
      cy.clearAndType('#property-label', 'Date Range', { delay: 0 });
      cy.get('#property-type').select('Single date range');

      cy.contains('.metadataTemplate-list > li:nth-child(18) span', 'Date')
        .siblings()
        .contains('button', 'Edit')
        .click();
      cy.clearAndType('#property-label', 'Multi Date Range', { delay: 0 });
      cy.get('#property-type').select('Multiple date range');

      cy.get('button').contains('Save').click();
      cy.get('div.alert-success').should('exist');
    });

    it('should not allow duplicated properties', () => {
      cy.get('.property-options-list li:first-child button').click();
      cy.get('button').contains('Save').click();
      cy.get('.alert.alert-danger').should('exist');
    });
  });

  describe('Entity Metadata', () => {
    it('should create an entity filling all the props.', () => {
      cy.contains('a', 'Library').click();
      cy.get('button').contains('Create entity').click();
      cy.get('textarea[name="library.sidepanel.metadata.title"]').should('not.be.disabled');
      cy.get('textarea[name="library.sidepanel.metadata.title"]').type(entityTitle, { delay: 0 });
      cy.contains('#metadataForm', 'Type').get('select').eq(0).select('All props');
      cy.get('select:first-of-type').select('All props');
      cy.get('.form-group.text input').type('demo text', { delay: 0 });
      cy.get('.form-group.numeric input').type('42', { delay: 0 });

      cy.contains('.form-group.select', 'Select').within(() => {
        cy.get('select').select('Activo');
      });

      cy.contains('.form-group.relationship', 'Relationship').within(() => {
        cy.contains('19 Comerciantes').click();
      });

      cy.contains('.form-group.date', 'Single Date').within(() => {
        cy.get('input').type('08/09/1966', { delay: 0 });
      });

      addImage();
      addVideo('Add file');
      cy.addTimeLink(1000, 'Second one');
      cy.get('.leaflet-container').click(200, 100);
      cy.get('.leaflet-container').click(200, 100);
      cy.get('.leaflet-marker-icon').should('have.length', 1);

      cy.contains('.form-group.multiselect', 'Multiselect').within(() => {
        cy.contains('Activo').click();
      });

      cy.get('.form-group.daterange div.DatePicker__From input').type('23/11/1963', { delay: 0 });
      cy.get('.form-group.daterange div.DatePicker__To input').type('12/09/1964', { delay: 0 });
      cy.get('.form-group.multidate button.btn.add').click();
      cy.get('.form-group.multidate .multidate-item:first-of-type input').type('23/11/1963', {
        delay: 0,
      });
      cy.get('.form-group.multidate .multidate-item:nth-of-type(2) input').type('12/09/1964', {
        delay: 0,
      });
      cy.get('.form-group.multidaterange button.btn.add').click();
      cy.get('.form-group.link #label').type('Huridocs', { delay: 0 });
      cy.get('.form-group.link #url').scrollIntoView();
      cy.get('.form-group.link #url').type('https://www.huridocs.org/', { delay: 0 });
      cy.get(
        '.form-group.multidaterange .multidate-item:first-of-type div.DatePicker__From input'
      ).type('23/11/1963', { delay: 0 });
      cy.get(
        '.form-group.multidaterange .multidate-item:first-of-type div.DatePicker__To input'
      ).type('12/09/1964', { delay: 0 });
      cy.get(
        '.form-group.multidaterange .multidate-item:nth-of-type(2) div.DatePicker__From input'
      ).type('23/11/1963', { delay: 0 });
      cy.get(
        '.form-group.multidaterange .multidate-item:nth-of-type(2) div.DatePicker__To input'
      ).type('12/09/1964', { delay: 0 });
      cy.get('.form-group.markdown textarea').type(textWithHtml, { delay: 0 });
      saveEntity();
      cy.waitForLegacyNotifications();
    });

    it('should have all the values correctly saved.', () => {
      cy.contains('.item-document:nth-child(1) span', 'Entity with all props').click();
      cy.get('.metadata-type-text').should('contain.text', 'demo text');
      cy.get('.metadata-type-numeric').should('contain.text', '42');
      cy.get('.metadata-type-select').should('contain.text', 'Activo');
      cy.get('.metadata-type-multiselect').should('contain.text', 'Activo');
      cy.get('.metadata-type-relationship').should('contain.text', '19 Comerciantes');
      cy.get('.metadata-type-date').should('contain.text', 'Sep 8, 1966');
      cy.get('.metadata-type-daterange').should(
        'contain.text',
        'Date RangeNov 23, 1963 ~ Sep 12, 1964'
      );
      cy.get('.metadata-type-multidate').should(
        'contain.text',
        'Multi DateNov 23, 1963Sep 12, 1964'
      );
      cy.contains('.metadata-type-multidaterange', 'Multi Date RangeNov 23, 1963 ~ Sep 12, 1964');
      cy.get('.metadata-type-link a')
        .should('have.text', 'Huridocs')
        .and('have.attr', 'href', 'https://www.huridocs.org/');
      cy.get('.side-panel.is-active .sidepanel-body.scrollable').scrollTo(0, 1300);
      checkMediaSnapshots('#tabpanel-metadata .metadata-type-multimedia.metadata-name-media');
      cy.get('.leaflet-container').scrollIntoView();
      cy.get('.leaflet-marker-icon').should('have.length', 1);
    });

    it('should check that the HTML is show as expected', () => {
      cy.contains('h1', 'The title').should('exist');
      cy.contains('a', 'I am a link to an external site').should('exist');
      cy.contains('.someClass > li:nth-child(1)', 'List item 1').should('exist');
      cy.contains('.someClass > li:nth-child(2)', 'List item 2').should('exist');
    });

    it('should check the media properties', () => {
      cy.get('.metadata-name-image > dd > img')
        .should('have.prop', 'src')
        .and('match', /\w+\/api\/files\/\w+\.jpg$/);
      cy.contains('#tabpanel-metadata .metadata-name-media', 'Media').scrollIntoView();
      cy.contains('#tabpanel-metadata .metadata-name-media', 'Media').within(() => {
        cy.get('video')
          .should('have.prop', 'src')
          .and('match', /^blob:http:\/\/localhost:3000\/[\w-]+$/);
      });
      const expectedNewEntityFiles = ['batman.jpg', 'short-video.mp4'];
      cy.get('.attachment-name span:not(.attachment-size)').each((element, index) => {
        const content = element.text();
        cy.wrap(content).should('eq', expectedNewEntityFiles[index]);
      });
    });

    it('should navigate to an entity via the rich text field link', () => {
      cy.contains('a', 'I am a link to the Tracy Robinson entity').click();
      cy.contains('.content-header-title > h1:nth-child(1)', 'Tracy Robinson').should('exist');
    });
  });

  describe('Media properties', () => {
    it('should allow add timelinks to an existing entity media property', () => {
      cy.contains('a', 'Library').click();
      cy.contains('.item-document:nth-child(1) span', 'Entity with all props').click();
      cy.contains('Text');
      cy.intercept('GET', 'api/files/*').as('getFile');
      clickOnEditEntity();
      cy.wait('@getFile');
      cy.get('.side-panel.is-active .sidepanel-body.scrollable').scrollTo(0, 1000);
      cy.addTimeLink(1000, 'Control point', 1, 12, 0);
      saveEntity('Entity updated');
      cy.waitForLegacyNotifications();
      checkMediaSnapshots('#tabpanel-metadata .video-container > div:nth-child(2)');
    });

    it('should render the player for internal media on library card and entity view', () => {
      cy.contains('.item-document:nth-child(1)', 'Entity with all props').toMatchImageSnapshot();
      cy.contains('.item-document:nth-child(1)', 'Entity with all props').contains('View').click();
      cy.contains('h1', 'Entity with all props');
      cy.get('.react-player').within(() => {
        cy.get('video', { timeout: 1000 });
      });
    });

    it('should allow set an external link from a media property', () => {
      cy.contains('a', 'Library').click();
      cy.intercept('GET', 'api/files/*').as('getFile');
      cy.contains('.item-document:nth-child(1) span', 'Entity with all props').click();
      clickOnEditEntity();
      cy.get('.side-panel.is-active .sidepanel-body.scrollable').scrollTo(0, 1500);
      cy.contains('Update');
      cy.wait('@getFile');
      cy.wait('@getFile');
      cy.wait('@getFile');
      clickMediaAction('Media', 'Update');
      addVideo('', false);
      cy.contains('button', 'Add timelink').click();
      cy.clearAndType('input[name="timelines.0.timeMinutes"]', '09', { delay: 0 });
      cy.clearAndType('input[name="timelines.0.timeSeconds"]', '57', { delay: 0 });
      cy.clearAndType('input[name="timelines.0.label"]', 'Dragon', { delay: 0 });
      saveEntity('Entity updated');
      checkExternalMedia();
    });

    it('should show the external player on library card and entity view', () => {
      cy.contains('.item-document:nth-child(1)', 'Entity with all props').toMatchImageSnapshot();
      cy.contains('.item-document:nth-child(1)', 'Entity with all props').contains('View').click();
      cy.contains('h1', 'Entity with all props');
      checkExternalMedia();
    });

    it('should show an error for an invalid property and allow to replace it for a valid one', () => {
      cy.contains('a', 'Library').click();
      cy.contains('.item-document:nth-child(1) span', 'Entity with all props').click();
      clickOnEditEntity();
      clickMediaAction('Image', 'Unlink');
      addInvalidImageFile('Image');
      clickMediaAction('Media', 'Unlink');
      addInvalidVideoFile('Media');

      clickMediaAction('Image', 'Unlink');
      addImage();
      clickMediaAction('Media', 'Unlink');
      addVideo('Add file');
      saveEntity('Entity updated');

      cy.get('.metadata-name-image > dd > img')
        .should('have.prop', 'src')
        .and('match', /\w+\/api\/files\/\w+\.jpg$/);
      cy.contains('#tabpanel-metadata .metadata-name-media', 'Media').scrollIntoView();
      cy.contains('#tabpanel-metadata .metadata-name-media', 'Media').within(() => {
        cy.get('video')
          .should('have.prop', 'src')
          .and('match', /^blob:http:\/\/localhost:3000\/[\w-]+$/);
      });
    });

    it('should allow unlink the value of a media property', () => {
      clickOnEditEntity();
      clickMediaAction('Image', 'Unlink');
      clickMediaAction('Media', 'Unlink');
      saveEntity('Entity updated');
      cy.waitForLegacyNotifications();
    });
  });

  describe('Thesauri values shortcut', () => {
    it('should add a thesauri value on a single select field and select it', () => {
      cy.contains('.item-document:nth-child(1) span', 'Entity with all props').click();
      clickOnEditEntity();
      // wait for the thesauri values to load
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(200);
      cy.contains('Type');
      cy.contains(
        '#metadataForm > div:nth-child(3) > .form-group.select > ul > .wide > div > div > button > span',
        'add value'
      ).click();
      cy.contains('.modal-content', 'Add thesaurus value');
      cy.get('input[name=value]#newThesauriValue').focus();
      cy.get('input[name=value]#newThesauriValue').type('New Single Value', {
        delay: 0,
      });
      cy.contains('.confirm-button', 'Save').click();
      cy.contains('Thesaurus saved');
      cy.waitForLegacyNotifications();
    });

    it('should add a thesauri value on a multiselect field and select it', () => {
      cy.get('.side-panel.is-active .sidepanel-body.scrollable').scrollTo(0, 1300);
      cy.contains(
        '#metadataForm > div:nth-child(3) > .form-group.multiselect > ul > .wide > div > div > button > span',
        'add value'
      ).click();
      cy.contains('.modal-content', 'Add thesaurus value');
      cy.get('input[name=value]#newThesauriValue').type('New Value', {
        delay: 0,
      });
      cy.contains('.confirm-button', 'Save').click();
      cy.contains('Thesaurus saved');
      cy.waitForLegacyNotifications();
      saveEntity('Entity updated');
      cy.get('.metadata-type-select').should('contain.text', 'New Single Value');
      cy.get('.metadata-type-multiselect').should('contain.text', 'MultiselectActivoNew Value');
    });
  });
  describe('Entity Translations', () => {
    it('should change the entity in Spanish', () => {
      changeLanguage('Español');
      cy.contains('.item-document:nth-child(1) span', 'Entity with all props').click();
      clickOnEditEntity('Editar');
      cy.get('textarea[name="library.sidepanel.metadata.title"]').click();
      cy.clearAndType(
        'textarea[name="library.sidepanel.metadata.title"]',
        'Entidad con todas las propiedades',
        {
          delay: 0,
        }
      );
      cy.get('input[name="library.sidepanel.metadata.metadata.text"]').click();
      cy.clearAndType(
        'input[name="library.sidepanel.metadata.metadata.text"]',
        'Texto de prueba en Español',
        { delay: 0 }
      );
      cy.contains('button', 'Guardar').click();
    });

    it('should check the values for the entity in Spanish', () => {
      cy.contains('.item-document', 'Entidad con todas las propiedades').click();
      cy.contains('h1.item-name', 'Entidad con todas las propiedades').should('exist');
      cy.get('.metadata-type-text').should('contain.text', 'Texto de prueba en Español');
    });

    it('should edit the text field in English', () => {
      changeLanguage('English');
      cy.contains('.item-document', 'Entity with all props').click();
      clickOnEditEntity();
      cy.get('input[name="library.sidepanel.metadata.metadata.text"]').click();
      cy.clearAndType(
        'input[name="library.sidepanel.metadata.metadata.text"]',
        'Demo text in english',
        { delay: 0 }
      );
      saveEntity('Entity updated');
      cy.waitForLegacyNotifications();
      cy.contains('.item-document', 'Entity with all props').click();
      cy.contains('h1.item-name', 'Entity with all props').should('exist');
      cy.get('.metadata-type-text').should('contain.text', 'Demo text in english');
    });

    it('should not affect the text field in Spanish', () => {
      cy.intercept('GET', 'es/library/*').as('getLibrary');
      changeLanguage('Español');
      cy.wait('@getLibrary');
      cy.contains('Configuración de filtros');
      cy.contains('.item-document:nth-child(1) span', 'Entidad con todas las propiedades').click();
      cy.contains('.metadata-type-text > dd', 'Texto de prueba en Español').should('exist');
    });
  });
  describe('Empty properties', () => {
    it('should be able to remove all the values from properties.', () => {
      changeLanguage('English');
      cy.contains('.item-document:nth-child(1) span', 'Entity with all props').click();
      clickOnEditEntity();
      cy.contains('Type');
      cy.get('.form-group.text input').clear({ force: true });
      cy.get('.form-group.numeric input').clear({ force: true });
      cy.get('.form-group.select select').select('Select...', { force: true });
      cy.get('.form-group.multiselect li.multiselectItem').contains('Activo').click();
      cy.get('.form-group.multiselect li.multiselectItem').contains('New Value').click();
      cy.get('.form-group.relationship li.multiselectItem').contains('19 Comerciantes').click();

      cy.get('.form-group.date input').eq(0).scrollIntoView();
      cy.get('.form-group.date input').eq(0).clear();
      cy.get('.form-group.daterange div.DatePicker__From input').clear();
      cy.get('.form-group.daterange div.DatePicker__To input').clear();
      cy.get('.form-group.multidate .multidate-item:nth-of-type(2) > button').click();
      cy.get('.form-group.multidate .multidate-item:first-of-type > button').click();
      cy.get('div.form-group.multidaterange .multidate-item:nth-child(2) > div > button').click();
      cy.get('div.form-group.multidaterange .multidate-item:nth-child(1) > div > button').click();
      cy.get('.form-group.markdown textarea').scrollIntoView();
      cy.get('.form-group.markdown textarea').clear();
      cy.get('.form-group.link #label').clear();
      cy.get('.form-group.link #url').clear();

      cy.get('.form-group #lat').scrollIntoView();
      cy.get('.form-group #lat').clear();
      cy.get('.form-group #lon').clear();

      saveEntity('Entity updated');
    });

    it('should not have metadata.', () => {
      cy.get('div.metadata.tab-content-visible div.view > dl > div').should('have.length', 0);
    });
  });
});
