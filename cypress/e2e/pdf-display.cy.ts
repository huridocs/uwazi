/* eslint-disable max-lines */
/* eslint-disable max-statements */
import { clearCookiesAndLogin } from './helpers/login';
import {
  clickOnCreateEntity,
  editPropertyForExtractor,
  saveEntity,
  waitForLegacyNotifications,
} from './helpers';

describe('PDF display', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.blankState();
    cy.exec('yarn ix-config', { env });
    clearCookiesAndLogin('admin', 'change this password now');
  });

  describe('setup', () => {
    it('should setup the template', () => {
      cy.contains('a', 'Settings').click();
      cy.contains('a', 'Templates').click();
      cy.contains('li', 'Document').contains('a', 'Edit').click();
      cy.contains('li', 'Text').within(() => {
        cy.get('button').click();
      });
      cy.contains('button', 'Save').click();
      cy.contains('div', 'Saved successfully.');
    });

    it('should create and entity with a pdf file', () => {
      cy.contains('a', 'Library').click();
      clickOnCreateEntity();
      cy.get('[name="library.sidepanel.metadata.title"]').click();
      cy.get('[name="library.sidepanel.metadata.title"]').type('Entity with pdf', { delay: 0 });
      cy.get('.document-list-parent > input').first().selectFile('./cypress/test_files/valid.pdf', {
        force: true,
      });
      saveEntity();
      waitForLegacyNotifications();
      cy.get('.metadata-sidepanel.is-active .closeSidepanel').click();
    });
  });

  describe('Library', () => {
    it('should wait until document processing is done and view the entity', () => {
      cy.contains('.item-document', 'Entity with pdf').within(() => {
        cy.contains('span', 'Processing...').should('not.exist');
        cy.contains('a', 'View').click();
      });
    });

    it('should check the document', () => {
      cy.contains('CORTE INTERAMERICANA DE DERECHOS HUMANOS');
      cy.get('.row').eq(0).toMatchImageSnapshot();
      cy.get('div[data-region-selector-id="1"]').toMatchSnapshot({ name: 'PDF library render' });
    });

    it('should paginate forward', () => {
      cy.get('.paginator').within(() => {
        cy.contains('a', 'Next').realClick();
      });
      cy.contains('Los escritos de 17 de septiembre y 17 de noviembre de 2010,');

      cy.get('.paginator').within(() => {
        cy.contains('2 / 22');
        cy.contains('a', 'Next').realClick();
      });
      cy.contains('especial de protección de los beneficiarios de las medidas,');

      cy.get('.paginator').within(() => {
        cy.contains('3 / 22');
        cy.contains('a', 'Next').realClick();
      });
      cy.contains('En la presente Resolución el Tribunal examinará:');
      cy.contains('CORTE INTERAMERICANA DE DERECHOS HUMANOS').should('not.exist');
    });

    it('should check that visited pages are unmounted and that non visited pages are not rendered', () => {
      cy.get('#page-1 > div').should('be.empty');
      cy.get('#page-10').should('be.empty');
    });

    it('should paginate backwards', () => {
      cy.get('.paginator').within(() => {
        cy.contains('4 / 22');
        cy.contains('a', 'Previous').realClick();
      });
      cy.contains('especial de protección de los beneficiarios de las medidas,');
      cy.contains('En la presente Resolución el Tribunal examinará:').should('not.be.visible');
    });

    it('should show the plaintex for the page', () => {
      cy.contains('a', 'Plain text').realClick();
      cy.get('.raw-text').should('be.visible');
      cy.get('.raw-text').within(() => {
        cy.contains('-3especial de protección');
      });
    });

    it('should paginate in plain text view', () => {
      cy.get('.paginator').within(() => {
        cy.contains('a', 'Next').realClick();
      });
      cy.get('.raw-text').within(() => {
        cy.contains('-4-');
      });
    });
  });

  describe('IX sidepanel', () => {
    describe('setup', () => {
      it('should navigate to the entity with the document', () => {
        cy.contains('a', 'Library').click();
        cy.contains('.item-document', 'Entity with pdf').within(() => {
          cy.contains('a', 'View').click();
        });
      });

      it('should make a selection for the text property to test sidepanel automatic scroll', () => {
        cy.get('.paginator').within(() => {
          cy.contains('a', 'Next').click();
        });
        cy.contains('Los escritos de 17 de septiembre y 17 de noviembre de 2010,');

        cy.get('button.edit-metadata').click();

        cy.contains(
          'span[role="presentation"]',
          'Los escritos de 12 de agosto, 14 y 26 de octubre y 24 de noviembre de 2010, de 3'
        ).setSelection(
          'Los escritos de 12 de agosto, 14 y 26 de octubre y 24 de noviembre de 2010, de 3'
        );

        cy.get('.form-group.text').within(() => {
          cy.get('button.extraction-button').click();
        });
        cy.get('input[name="documentViewer.sidepanel.metadata.metadata.text"]')
          .invoke('val')
          .should(
            'eq',
            'Los escritos de 12 de agosto, 14 y 26 de octubre y 24 de noviembre de 2010, de 3'
          );

        cy.get('button[type="submit"]').click();
        cy.get('div.alert-success').click();
      });

      it('should navigate to the IX settings screen and create and extractor for the text property', () => {
        cy.contains('a', 'Settings').click();
        cy.contains('a', 'Metadata Extraction').click();
        cy.contains('button', 'Create Extractor').click();
        cy.getByTestId('modal').within(() => {
          cy.get('input[id="extractor-name"]').type('Extractor 1', { delay: 0 });
          editPropertyForExtractor('firstTemplate', 'Document', 'Text');
          cy.contains('button', 'Next').click();
          cy.contains('Text');
          cy.contains('button', 'Create').click();
        });
        cy.contains('td', 'Extractor 1');
        cy.contains('button', 'Dismiss').click();
      });
    });

    describe('pdf on the sidepanel', () => {
      it('should view the extractor', () => {
        cy.contains('a', 'Settings').click();
        cy.contains('a', 'Metadata Extraction').click();
        cy.contains('td', 'Extractor 1');
        cy.contains('button', 'Review').click();
        cy.contains('td', 'Entity with pdf (es)');
      });

      it('should check that the pdf renders and scrolls to the selection', () => {
        cy.contains('button', 'Open PDF').realClick();
        cy.contains('Loading').should('not.exist');
        cy.get('#pdf-container').within(() => {
          cy.contains(
            'Los escritos de 12 de agosto, 14 y 26 de octubre y 24 de noviembre de 2010, de 3'
          );
          cy.get('.highlight-rectangle').should('be.visible');
        });
        cy.get('#root').toMatchImageSnapshot();
        cy.get('div[data-region-selector-id="2"]').toMatchSnapshot({
          name: 'IX sidepanel library render',
        });
      });

      it('should only render visible pages', () => {
        cy.get('#page-2-container .page').should('not.be.empty');
        cy.get('#page-3-container .page').should('be.empty');
        cy.get('#page-7-container').scrollIntoView();
        cy.get('#page-7-container .page').should('not.be.empty');
        cy.get('#page-2-container .page').should('be.empty');
        cy.get('#page-3-container .page').should('be.empty');
        cy.contains('span[role="presentation"]', '1.3 Consideraciones de la Corte').should(
          'be.visible'
        );
      });

      it('should close the sidepanel', () => {
        cy.contains('button', 'Cancel').click();
      });
    });
  });

  describe('responsiveness', { viewportWidth: 768, viewportHeight: 1024 }, () => {
    describe('library', () => {
      it('should navigate to the library', () => {
        cy.get('header').within(() => {
          cy.get('.menu-button').realTouch();
        });
        cy.contains('a', 'Library').realTouch();
        cy.contains('.item-document', 'Entity with pdf');
      });

      it('should view the pdf correctly', () => {
        cy.contains('.item-document', 'Entity with pdf').within(() => {
          cy.contains('a', 'View').realTouch();
        });
        cy.contains('CORTE INTERAMERICANA DE DERECHOS HUMANOS');
        cy.get('.closeSidepanel').realTouch();
        cy.get('aside.metadata-sidepanel').should('not.be.visible');
        cy.contains('CORTE INTERAMERICANA DE DERECHOS HUMANOS').should('be.visible');
        cy.get('#root').toMatchImageSnapshot();
      });

      it('should check that the selection looks ok', () => {
        cy.get('#page-2').scrollIntoView();
        cy.contains('Los escritos de 17 de septiembre y 17 de noviembre de 2010,').should(
          'be.visible'
        );
        cy.get('.ContextMenu-bottom .btn').realTouch();
        cy.contains('.btn', 'Edit').realTouch();
        cy.get('.highlight-rectangle').toMatchSnapshot({ name: 'responsive selection' });
        cy.get('#root').toMatchImageSnapshot();
        cy.contains('.btn', 'Cancel').realTouch();
        cy.get('.closeSidepanel').realTouch();
      });
    });

    describe('IX sidepanel', { viewportWidth: 375, viewportHeight: 812 }, () => {
      it('should navigate to the extractor', () => {
        cy.get('header').within(() => {
          cy.get('.menu-button').realTouch();
        });
        cy.get('.menuActions > .menuNav-list').within(() => {
          cy.contains('.only-mobile', 'Settings').realTouch();
        });
        cy.contains('a', 'Metadata Extraction').realTouch();
        cy.contains('td', 'Extractor 1');
        cy.contains('button', 'Review').realTouch();
        cy.contains('td', 'Entity with pdf (es)');
      });

      it('should open the pdf sidepanel and show the correct page', () => {
        cy.contains('button', 'Open PDF').scrollIntoView();
        cy.contains('button', 'Open PDF').realTouch();
        cy.contains('Loading').should('not.exist');
        cy.get('#pdf-container').within(() => {
          cy.contains(
            'Los escritos de 12 de agosto, 14 y 26 de octubre y 24 de noviembre de 2010, de 3'
          );
          cy.get('.highlight-rectangle').should('be.visible');
        });
        cy.get('#root').toMatchImageSnapshot();
      });

      it('should only show visible pages', () => {
        cy.get('#page-1-container .page').should('be.empty');
        cy.get('#page-2-container .page').should('not.be.empty');
        cy.get('#page-3-container .page').should('not.be.empty');
        cy.get('#page-10-container .page').should('be.empty');
        cy.get('#page-10-container').scrollIntoView();
        cy.get('#page-1-container .page').should('be.empty');
        cy.get('#page-2-container .page').should('be.empty');
        cy.get('#page-3-container .page').should('be.empty');
        cy.get('#page-10-container .page').should('not.be.empty');
        cy.get('#page-11-container .page').should('not.be.empty');
        cy.contains(
          'span[role="presentation"]',
          'El artículo 63.2 de la Convención exige que para que la Corte pueda disponer de'
        ).should('be.visible');
      });
    });
  });
});
