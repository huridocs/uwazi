/* eslint-disable max-lines */
/* eslint-disable max-statements */
import { clearCookiesAndLogin } from './helpers/login';

const viewport = {
  viewportWidth: 375,
  viewportHeight: 667,
};

// This test is a migration of e2e/mobile/sidePanels.test.ts,
// it partially covers library responsivenes.
// e2e/mobile/library.test.ts should be integrated into this test
describe('Library responsive view', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin('admin', 'admin');
  });

  describe('Toolbar', viewport, () => {
    it('should open the toolbar', () => {
      cy.contains('button', 'Show toolbar').realTouch();
      cy.get('div.search-list').should('be.visible');
      cy.get('#root').toMatchImageSnapshot();
    });

    it('show sould the filters sidepanel', () => {
      cy.contains('button', 'Show filters').realTouch();
      cy.contains('.sidepanel-title', 'Filters');
      cy.get('#root').toMatchImageSnapshot();
      cy.get('.closeSidepanel.only-mobile').realTouch();
      cy.contains('button', 'Hide toolbar').realTouch();
    });

    it('should open the actions bar', () => {
      cy.contains('button', 'Show actions').realTouch();
      cy.get('#root').toMatchImageSnapshot();
      cy.contains('button', 'Hide actions').realTouch();
    });
  });

  describe('Entity view', viewport, () => {
    it('should navigate to the first entity and see the sidepanel', () => {
      cy.contains(
        '.item-document',
        'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
      )
        .contains('a', 'View')
        .realTouch();

      cy.get('.side-panel.metadata-sidepanel.is-active').should('be.visible');
      cy.get('#root').toMatchImageSnapshot();
    });

    it('should check some of the metadata', () => {
      cy.get('.side-panel.metadata-sidepanel.is-active').within(() => {
        cy.contains(
          '.item-name',
          'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
        );
        cy.contains('dl', 'País').contains('a', 'Costa Rica');
        cy.contains('dl', 'Firmantes').contains('a', 'Eduardo Vio Grossi');
        cy.get('.filelist').scrollIntoView();
        cy.contains('div', 'SamplePDF.pdf').should('be.visible');
      });
    });
  });
});
