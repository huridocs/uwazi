import { clearCookiesAndLogin } from './helpers/login';

describe('Media metadata', { defaultCommandTimeout: 5000 }, () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  beforeEach(() => {
    cy.intercept('POST', 'api/entities').as('saveEntity');
  });

  const clickMediaAction = (field: string, action: string) => {
    cy.contains(field).parentsUntil('.form-group').contains('button', action).scrollIntoView();
    cy.contains(field).parentsUntil('.form-group').contains('button', action).click();
  };
  const addEntity = (title: string) => {
    cy.contains('button', 'Create entity').click();
    cy.get('textarea[name="library.sidepanel.metadata.title"]').type(title);
    cy.get('#metadataForm')
      .contains('Type')
      .parentsUntil('.form-group')
      .find('select')
      .select('Reporte');
    cy.contains('Descriptor').parentsUntil('.form-group').find('select').select('Familia');
  };

  const addVideo = (local: boolean = true) => {
    clickMediaAction('Video', 'Add file');

    if (local) {
      cy.get('.upload-button input[type=file]')
        .last()
        .selectFile('./e2e/test_files/short-video.mp4', {
          force: true,
        });
    } else {
      cy.get('input[name="urlForm.url"]').type(
        'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
      );
      cy.contains('button', 'Add from URL').click();
    }

    cy.get('video').should('be.visible');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
  };

  const addImage = () => {
    clickMediaAction('Fotografía', 'Add file');
    cy.contains('button', 'Select from computer');
    cy.get('.upload-button input[type=file]').first().selectFile('./e2e/test_files/batman.jpg', {
      force: true,
    });
    // wait for image
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(200);
    cy.get('img').should('be.visible');
  };
  const addInvalidFile = (field: string) => {
    cy.contains(field).parentsUntil('.form-group').contains('button', 'Add file').scrollIntoView();
    cy.contains(field).parentsUntil('.form-group').contains('button', 'Add file').click();
    cy.contains('button', 'Select from computer');
    cy.get('.upload-button input[type=file]').first().selectFile('./e2e/test_files/valid.pdf', {
      force: true,
    });
    cy.contains(field)
      .parentsUntil('.form-group')
      .contains('This file type is not supported on media fields')
      .should('be.visible');
  };

  const checkMediaSnapshots = (selector: string) => {
    cy.get(selector).scrollIntoView();
    cy.get(selector).toMatchImageSnapshot({ disableTimersAndAnimations: true, threshold: 0.08 });
  };

  const saveEntity = () => {
    cy.contains('button', 'Save').click();
    cy.wait('@saveEntity');
    // waiting for video
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(200);
    cy.get('video', { timeout: 2000 }).should('be.visible');
  };
  it('should allow media selection on entity creation', () => {
    addEntity('Reporte audiovisual');
    addVideo();
    addImage();
    saveEntity();
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-fotograf_a');
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-video');
  });

  it('should allow add timelinks to an existing entity media property', () => {
    cy.contains('h2', 'Reporte audiovisual').click();
    cy.contains('button', 'Edit').should('be.visible').click();
    cy.addTimeLink(2000, 'Control point');
    saveEntity();
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-fotograf_a');
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-video');
  });

  it('should allow media selection with timelinks on entity creation', () => {
    addEntity('Reporte audiovisual con lineas de tiempo');
    addVideo();
    cy.addTimeLink(2000, 'Second one');
    saveEntity();
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-video');
  });

  it('should allow edit media created with timelinks', () => {
    cy.contains('h2', 'Reporte audiovisual con lineas de tiempo').click();
    cy.contains('button', 'Edit').should('be.visible').click();
    cy.addTimeLink(4000, 'Second three', 1);
    saveEntity();
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-video');
  });

  it('should allow remove a timelink from a media property', () => {
    cy.contains('h2', 'Reporte audiovisual con lineas de tiempo').click();
    cy.contains('button', 'Edit').should('be.visible').click();
    cy.get('.timelinks-form').scrollIntoView();
    cy.get('.delete-timestamp-btn').eq(1).click();
    saveEntity();
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-video');
  });

  it('should allow set an external link from a media property', () => {
    addEntity('Reporte con contenido externo');
    addVideo(false);
    cy.contains('button', 'Add timelink').scrollIntoView();
    cy.contains('button', 'Add timelink').should('be.visible').click();
    cy.clearAndType('input[name="timelines.0.timeMinutes"]', '09');
    cy.clearAndType('input[name="timelines.0.timeSeconds"]', '57');
    cy.clearAndType('input[name="timelines.0.label"]', 'Dragon');
    saveEntity();
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-video');
  });
  it('should show an error for an invalid property and allow to replace it for a valid one', () => {
    addEntity('Reporte con propiedades audiovisuales corregidas');
    addInvalidFile('Fotografía');
    addInvalidFile('Video');
    clickMediaAction('Video', 'Unlink');
    addVideo();
    clickMediaAction('Fotografía', 'Unlink');
    addImage();
    saveEntity();
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-fotograf_a');
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-video');
  });
  it('should allow unlink the value of a media property', () => {
    cy.contains('h2', 'Reporte con propiedades audiovisuales corregidas').click();
    cy.contains('button', 'Edit').should('be.visible').click();
    clickMediaAction('Video', 'Unlink');
    cy.contains('button', 'Save').click();
    cy.wait('@saveEntity');
    cy.contains('Entity updated').should('be.visible');
  });
});
