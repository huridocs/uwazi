import { clearCookiesAndLogin } from '../helpers';
import 'cypress-axe';

const labelEntityTitle = (
  entityPos: number,
  selectValue: string,
  selector: string = 'span[role="presentation"]'
) => {
  cy.get('.view-doc').eq(entityPos).click();
  //@ts-ignore
  cy.contains(selector, selectValue).setSelection(selectValue);
  cy.get('button.edit-metadata').click();
  cy.get('button.extraction-button').first().click();
  cy.get('textarea[name="documentViewer.sidepanel.metadata.title"]')
    .invoke('val')
    .should('eq', selectValue);
  cy.get('button[type="submit"]').click();
  cy.get('div.alert-success').click();
};

const editPropertyForExtractor = (
  alias: string,
  templateName: string,
  property: string,
  remove?: boolean
) => {
  cy.get('[data-testid=modal]').contains('li', templateName).as(alias);
  if (remove) {
    cy.get(`@${alias}`).contains('label', property).click();
  } else {
    cy.get(`@${alias}`).find('label').click();
    cy.get(`@${alias}`).contains('label', property).click();
  }
};

describe('Information Extraction', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-puppeteer-fixtures', { env });
    cy.exec('yarn ix-config', { env });
    clearCookiesAndLogin();
    cy.injectAxe();
  });

  describe('labeling entities', () => {
    it('should label the title property for the first two entities', () => {
      labelEntityTitle(0, 'Lorem Ipsum');
      cy.get('a[aria-label="Library"]').click();
      labelEntityTitle(1, 'Uwazi Heroes Investigation');
    });
  });

  describe('Dashboard', () => {
    it('should navigate to the dashboard', () => {
      cy.get('.only-desktop a[aria-label="Settings"]').click();
      cy.contains('a', 'Metadata Extraction').click();
    });

    it('Should create an extractor', () => {
      cy.contains('button', 'Create Extractor').click();
      cy.get('[data-testid=modal]').within(() => {
        cy.get('input').type('Extractor 1');
      });

      editPropertyForExtractor('firstTemplate', 'Ordenes del presidente', 'Title');

      editPropertyForExtractor('secondTemplate', 'Causa', 'Title');

      cy.contains('button', 'Add').click();
      cy.contains('td', 'Extractor 1');
      cy.contains('button', 'Dismiss').click();
    });

    it('should create another extractor selecting all templates', () => {
      cy.contains('button', 'Create Extractor').click();
      cy.get('[data-testid=modal]').within(() => {
        cy.get('input').type('Titles from all templates');
      });

      editPropertyForExtractor('ordenesDelPresidente', 'Ordenes del presidente', 'Title');
      cy.contains('button', 'From all templates').click();
      cy.contains('button', 'Add').click();
      cy.contains('td', 'Titles from all templates');
      cy.contains('button', 'Dismiss').click();
    });

    it('should create another extractor selecting all templates with the relevant property', () => {
      cy.contains('button', 'Create Extractor').click();
      cy.get('[data-testid=modal]').within(() => {
        cy.get('input').type('Fechas from relevant templates');
      });

      editPropertyForExtractor('ordenesDeLaCorte', 'Ordenes de la corte', 'Fecha');
      cy.contains('button', 'From all templates').click();
      cy.contains('button', 'Add').click();
      cy.contains('td', 'Fechas from relevant templates');
      cy.contains('button', 'Dismiss').click();
    });

    it('should edit Extractor 1', () => {
      cy.get('tbody > tr')
        .eq(0)
        .within(() => {
          cy.get('td').eq(0).get('input').click();
        });
      cy.contains('button', 'Edit Extractor').click();

      cy.get('[data-testid=modal]').within(() => {
        cy.get('input').eq(0).type(' edited');
      });

      editPropertyForExtractor('ordenesDeLaCorte', 'Ordenes de la corte', 'Title');
      editPropertyForExtractor('causa', 'Causa', 'Title', true);

      cy.contains('button', 'Save').click();
      cy.contains('td', 'Extractor 1 edited');
      cy.contains('button', 'Dismiss').click();
    });

    it('should not be able to edit when selecting multiple extractors', () => {
      cy.contains('label', 'Select all').within(() => {
        cy.get('input').click();
      });
      cy.contains('button', 'Edit Extractor').should('not.exist');
    });

    it('should delete an extractor', () => {
      cy.contains('label', 'Select all').within(() => {
        cy.get('input').click();
      });

      cy.get('tbody > tr')
        .eq(2)
        .within(() => {
          cy.get('td').eq(0).get('input').click();
        });
      cy.contains('button', 'Delete').click();

      cy.get('[data-testid=modal]').within(() => {
        cy.contains('li', 'Titles from all templates');
        cy.contains('button', 'Accept').click();
      });

      cy.contains('td', 'Titles from all templates').should('not.exist');
      cy.contains('button', 'Dismiss').click();
    });

    it('should check table display and accessibility', () => {
      cy.get('[data-testid=settings-ix]').toMatchImageSnapshot();
      cy.checkA11y();
    });
  });

  describe('Review', () => {
    it('should navigate to the first extractor', () => {
      cy.contains('button', 'Review').eq(0).click();
    });

    it('should show title initial suggestion states as Empty / Label', () => {
      cy.get('.suggestion-templates span').eq(1).should('be.visible');
      cy.get('.training-dashboard').should('be.visible');
      cy.get('table').should('be.visible');
      cy.get('.settings-content').toMatchImageSnapshot();
    });

    it('should find suggestions successfully', { defaultCommandTimeout: 6000 }, () => {
      cy.get('.suggestion-templates span').eq(1).should('be.visible');
      cy.get('.training-dashboard').should('be.visible');
      cy.get('table').should('be.visible');
      cy.contains('button', 'Find suggestions').click();
      cy.get('table tr').should('have.length.above', 1);
      cy.get('.settings-content').toMatchImageSnapshot();
    });

    it('should show filters sidepanel', () => {
      cy.get('.suggestion-templates span').eq(1).should('be.visible');
      cy.get('.training-dashboard').should('be.visible');
      cy.get('table').should('be.visible');
      cy.contains('button', 'Show Filters').click();
      cy.get('.settings-content .sidepanel-body').toMatchImageSnapshot();
    });
  });
});
