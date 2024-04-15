/* eslint-disable max-lines */
import { clickOnCreateEntity, clickOnEditEntity } from './helpers/entities';
import { clearCookiesAndLogin } from './helpers/login';

describe('Media metadata', { defaultCommandTimeout: 5000 }, () => {
  before(() => {
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
    clickOnCreateEntity();
    cy.get('#metadataForm')
      .contains('Type')
      .parentsUntil('.form-group')
      .find('select')
      .select('Reporte');
    cy.contains('Descriptor').parentsUntil('.form-group').find('select').select('Familia');
    cy.get('textarea[name="library.sidepanel.metadata.title"]').type(title, { force: true });
  };

  const addVideo = (local: boolean = true) => {
    clickMediaAction('Video', 'Add file');
    if (local) {
      cy.get('.upload-button input[type=file]')
        .last()
        .selectFile('./cypress/test_files/short-video.mp4', {
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
    cy.get('.upload-button input[type=file]')
      .first()
      .selectFile('./cypress/test_files/batman.jpg', {
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
    cy.get('.upload-button input[type=file]')
      .first()
      .selectFile('./cypress/test_files/sample.pdf', {
        force: true,
      });
    cy.contains(field)
      .parentsUntil('.form-group')
      .contains('This file type is not supported on media fields')
      .should('be.visible');
  };

  const checkMediaSnapshots = (selector: string) => {
    cy.get(selector).scrollIntoView({ offset: { top: -30, left: 0 } });
    cy.get(selector).toMatchImageSnapshot({ disableTimersAndAnimations: true, threshold: 0.08 });
  };

  const saveEntity = (message = 'Entity created') => {
    cy.contains('button', 'Save').click();
    cy.wait('@saveEntity');
    cy.contains(message).as('successMessage');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);

    // waiting for video
    cy.get('aside video', { timeout: 5000 }).then(async $video => {
      const readyState = new Promise(resolve => {
        $video[0].removeAttribute('controls');
        const interval = setInterval(() => {
          const videoElement = $video[0] as HTMLVideoElement;
          if (videoElement.readyState >= 3) {
            clearInterval(interval);
            resolve($video);
          }
        }, 10);
        cy.get('@successMessage').should('not.exist');
      });
      await readyState;
    });
  };

  it('should allow media selection on entity creation', () => {
    addEntity('Reporte audiovisual');
    addImage();
    addVideo();
    saveEntity();

    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-fotograf_a');
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-video');
  });

  it('should allow add timelinks to an existing entity media property', () => {
    cy.contains('h2', 'Reporte audiovisual').click();
    cy.contains('button', 'Edit').should('be.visible');
    clickOnEditEntity();
    cy.addTimeLink(2000, 'Control point');
    saveEntity('Entity updated');
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-fotograf_a');
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-video');
  });

  it('should allow media selection with timelinks on entity creation', () => {
    addEntity('Reporte audiovisual con lineas de tiempo');
    addImage();
    addVideo();
    cy.addTimeLink(2000, 'Second one');
    saveEntity();
  });

  // eslint-disable-next-line max-statements
  it('should allow set an external link from a media property', () => {
    addEntity('Reporte con contenido externo');
    addImage();
    addVideo(false);
    cy.contains('button', 'Add timelink').scrollIntoView();
    cy.contains('button', 'Add timelink').should('be.visible').click();
    cy.clearAndType('input[name="timelines.0.timeMinutes"]', '09');
    cy.clearAndType('input[name="timelines.0.timeSeconds"]', '57');
    cy.clearAndType('input[name="timelines.0.label"]', 'Dragon');
    saveEntity();
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-video');
  });

  // eslint-disable-next-line max-statements
  it('should show an error for an invalid property and allow to replace it for a valid one', () => {
    addEntity('Reporte con propiedades audiovisuales corregidas');
    addInvalidFile('Fotografía');
    addInvalidFile('Video');
    clickMediaAction('Fotografía', 'Unlink');
    addImage();
    clickMediaAction('Video', 'Unlink');
    addVideo();
    saveEntity();
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-fotograf_a');
    checkMediaSnapshots('.metadata-type-multimedia.metadata-name-video');
  });

  it('should allow unlink the value of a media property', () => {
    cy.contains('h2', 'Reporte con propiedades audiovisuales corregidas').click();
    cy.contains('button', 'Edit').should('be.visible');
    clickOnEditEntity();
    clickMediaAction('Video', 'Unlink');
    cy.contains('button', 'Save').click();
    cy.wait('@saveEntity');
    cy.contains('Entity updated').as('successMessage');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get('@successMessage').should('not.exist');
  });

  describe('thumbnails', () => {
    const checkExternalMedia = () => {
      cy.get('video').should(
        'have.attr',
        'src',
        'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
      );
    };

    it('should mark media fields as visible on cards', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Templates').click();
      cy.contains('a', 'Reporte').click();
      cy.contains('span', 'Video').siblings().contains('button', 'Edit').click();
      cy.contains('span', 'Show in cards').click();
      cy.contains('button', 'Save').click();
      cy.contains('span', 'Saved successfully.').click();
      cy.contains('a', 'Library').click();
    });

    it('should display the external player for external media', () => {
      cy.get('.item-group > :nth-child(2)').within(() => {
        cy.contains('span', 'Reporte con contenido externo').click();
        cy.contains('Video').scrollIntoView({
          offset: { top: -10, left: 0 },
        });
        checkExternalMedia();
      });
    });

    it('should show the external player on the sidepanel and entity view', () => {
      cy.get('.item-group > :nth-child(2) > .item-info').click();
      cy.get('.side-panel.is-active').within(() => {
        cy.contains('h1', 'Reporte con contenido externo');
        cy.get('.metadata-type-multimedia.metadata-name-video').scrollIntoView({
          offset: { top: -30, left: 0 },
        });
        checkExternalMedia();
      });

      cy.get('.item-group > :nth-child(2)').within(() => {
        cy.contains('a', 'View').click();
      });

      cy.contains('h1', 'Reporte con contenido externo');
      checkExternalMedia();
    });

    it('should render a generic thumbnail for internal media', () => {
      cy.contains('a', 'Library').click();
      cy.contains('Video');
      cy.get('.item-group > :nth-child(3)').toMatchImageSnapshot();
    });

    it('should render the player for internal media on the sidepanel and entity view', () => {
      cy.get('.item-group > :nth-child(3) > .item-info').click();
      cy.get('.side-panel.is-active').within(() => {
        cy.contains('h1', 'Reporte audiovisual con lineas de tiempo');
        cy.get('.react-player').within(() => {
          cy.get('video', { timeout: 2000 });
        });
      });

      cy.get('.item-group > :nth-child(3)').within(() => {
        cy.contains('a', 'View').click();
      });

      cy.contains('h1', 'Reporte audiovisual con lineas de tiempo');

      cy.get('.react-player').within(() => {
        cy.get('video', { timeout: 2000 });
      });
    });
  });
});
