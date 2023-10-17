import { clearCookiesAndLogin } from './helpers/login';

describe('Copy from entity', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    clearCookiesAndLogin();
  });

  describe('Creating a new entity', () => {
    it('should copy the metadata from an existing entity to create a new one', () => {
      cy.contains('button', 'Create entity').click();
      cy.get('[name="library.sidepanel.metadata.title"]').type('New orden de la corte');
      cy.get('#metadataForm').find('select').select('Ordenes de la corte');
      cy.get('#metadataForm').find('.form-group.select').find('select').select('d3b1s0w3lzi');

      cy.contains('button', 'Copy From').click();
      cy.get('div.copy-from').within(() => {
        cy.get('input').type(
          'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
        );
        cy.contains(
          '.item-name',
          'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
        ).click();
        cy.contains('button', 'Copy Highlighted').click();
      });
      cy.get('div.copy-from').should('not.exist');

      cy.contains('button', 'Save').click();
    });

    it('should view the new entity', () => {
      cy.contains('Entity created').click();
      cy.contains('h2', 'New orden de la corte').click();
      cy.get('.side-panel.metadata-sidepanel.is-active').within(() => {
        cy.contains('a', 'View').click();
      });
      cy.contains('h1', 'New orden de la corte');
    });

    it('should check the data for the new entity', () => {
      cy.get('.entity-metadata').within(() => {
        cy.get('.metadata-name-mecanismo').within(() => {
          cy.contains('Corte Interamericana de Derechos Humanos');
        });

        cy.get('.metadata-name-fecha').within(() => {
          cy.contains('Feb 26, 2016');
        });

        cy.get('.metadata-name-pa_s').within(() => {
          cy.contains('Costa Rica');
        });

        cy.get('.metadata-name-firmantes').within(() => {
          cy.contains('Alberto Pérez Pérez');
          cy.contains('Diego García-Sayán');
          cy.contains('Eduardo Ferrer Mac-Gregor Poisot');
          cy.contains('Eduardo Vio Grossi');
          cy.contains('Humberto Antonio Sierra Porto');
          cy.contains('Roberto de Figueiredo Caldas');
        });

        cy.get('.metadata-name-tipo').within(() => {
          cy.contains('Supervisión de cumplimiento de Sentencia');
        });

        cy.get('.metadata-name-categor_a').within(() => {
          cy.contains('Categoría 1');
        });
      });
    });
  });

  // describe('editing an existing entity', () => {
  //   it('should edit an entity by using copy from', () => {
  //     cy.contains('a', 'Library').click();
  //     cy.contains(
  //       'h2',
  //       'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
  //     ).click();
  //     cy.contains('button', 'Edit').click();
  //     cy.contains('button', 'Copy From').click();

  //     cy.get('div.copy-from').within(() => {
  //       cy.get('input').type(
  //         'Apitz Barbera y otros. Resolución de la Presidenta de 18 de diciembre de 2009'
  //       );
  //       cy.contains(
  //         '.item-name',
  //         'Apitz Barbera y otros. Resolución de la Presidenta de 18 de diciembre de 2009'
  //       ).click();
  //       cy.contains('button', 'Copy Highlighted').click();
  //     });
  //     cy.get('div.copy-from').should('not.exist');

  //     cy.get('[name="library.sidepanel.metadata.title"]').clear();
  //     cy.get('[name="library.sidepanel.metadata.title"]').type('Edited orden de la corte');
  //     cy.get('#metadataForm')
  //       .contains('.multiselectItem-name', 'Comisión Interamericana de Derechos Humanos')
  //       .click();

  //     cy.contains('button', 'Save').click();
  //   });

  //   it('should view the edited entity', () => {
  //     cy.contains('Entity updated').click();
  //     cy.contains('h2', 'Edited orden de la corte').click();
  //     cy.get('.side-panel.metadata-sidepanel.is-active').within(() => {
  //       cy.contains('a', 'View').click();
  //     });
  //     cy.contains('h1', 'Edited orden de la corte');
  //   });

  //   it('should check the data for the edited entity', () => {});
  // });
});
