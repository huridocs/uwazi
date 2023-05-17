import { selectPublishedEntities, selectRestrictedEntities } from './helpers';
import { clearCookiesAndLogin } from './helpers/login';

describe('Entity metadata', () => {
  const titleEntity1 =
    'Resolución de la Corte IDH. Supervisión de cumplimiento de Sentencia de 29 de junio de 2005';
  const titleEntity2 = 'Applicability of Article 65 of the American Convention on Human Rights';
  const titleEntity3 = 'Article 65 of the American Convention on Human Rights';
  const titleEntity4 = 'Aitken';

  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    // cy.exec('yarn e2e-puppeteer-fixtures', { env });
    clearCookiesAndLogin();
  });

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

  const addVideo = (timeLinks: [] = []) => {
    cy.contains('Video').parentsUntil('.form-group').contains('button', 'Add file').click();
    cy.get('.upload-button input[type=file]')
      .last()
      .selectFile('./e2e/test_files/short-video.mp4', {
        force: true,
      });
  };

  const addImage = () => {
    cy.contains('Fotografía').parentsUntil('.form-group').contains('button', 'Add file').click();
    cy.contains('button', 'Select from computer');
    cy.get('.upload-button input[type=file]').first().selectFile('./e2e/test_files/batman.jpg', {
      force: true,
    });
  };

  const checkMediaSnapshots = () => {
    cy.get('.metadata-type-multimedia.metadata-name-fotograf_a').scrollIntoView();
    cy.get('.metadata-type-multimedia.metadata-name-fotograf_a').toMatchImageSnapshot();
    cy.get('.metadata-type-multimedia.metadata-name-video').scrollIntoView();
    cy.get('.metadata-type-multimedia.metadata-name-video').toMatchImageSnapshot();
  };

  it('should allow media selection on entity creation', () => {
    addEntity('Reporte audiovisual');
    addVideo();
    addImage();
    cy.intercept('POST', 'api/entities').as('saveEntity');
    cy.contains('button', 'Save').click();
    cy.wait('@saveEntity');
    checkMediaSnapshots();
  });

  //   // eslint-disable-next-line max-statements
  //   it('Should list available collaborators of an entity', () => {
  //     selectRestrictedEntities();
  //     cy.contains('h2', titleEntity1).click();
  //     cy.contains('button', 'Share').should('be.visible').click();

  //     cy.get('[data-testid=modal] input').focus();
  //     cy.contains('.userGroupsLookupField', 'Activistas');
  //     cy.contains('.userGroupsLookupField', 'Asesores legales');
  //     cy.contains('.userGroupsLookupField', 'Public');

  //     cy.contains('[data-testid=modal] button', 'Close').click();
  //     cy.get('[data-testid=modal]').should('not.be.visible');
  //   });

  //   it('Should update the permissions of an entity', () => {
  //     cy.contains('h2', titleEntity1).click();
  //     cy.contains('button', 'Share').should('be.visible').click();
  //     cy.get('[data-testid=modal] input').type('editor');
  //     cy.get('ul[role=listbox]').contains('span', 'editor').click();
  //     cy.get('[data-testid=modal] input').clear();
  //     cy.get('[data-testid=modal] input').type('Ase');
  //     cy.get('ul[role=listbox]').contains('span', 'Asesores legales').click();
  //     cy.get('div[data-testid=modal] select').eq(1).select('write');
  //     cy.get('[data-testid=modal]').contains('button', 'Save changes').click();
  //     cy.get('.alert.alert-success').click();
  //   });

  //   const checkCanEdit = (title: string, canEdit: boolean = true) => {
  //     cy.contains('h2', title).click();
  //     if (canEdit) {
  //       cy.get('aside.is-active').contains('button', 'Edit').should('exist');
  //     } else {
  //       cy.get('aside.is-active').contains('button', 'Edit').should('not.exist');
  //     }
  //   };

  //   it('should be able to edit and save', () => {
  //     cy.contains('h2', titleEntity4).click();
  //     cy.get('aside.is-active').contains('button', 'Edit').click();
  //     cy.get('aside.is-active textarea').eq(0).clear();
  //     cy.get('aside.is-active textarea').eq(0).type('Edited title');
  //     cy.get('aside.is-active').contains('button', 'Save').click();
  //     cy.get('div.alert').click();
  //     cy.contains('h2', 'Edited title').should('exist');
  //     cy.get('aside.is-active button[aria-label="Close side panel"]').click();
  //   });
});
