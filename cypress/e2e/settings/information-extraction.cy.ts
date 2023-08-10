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
  cy.getByTestId('modal').contains('li', templateName).as(alias);
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
  });

  describe('labeling entities', () => {
    it('should label the title property for the first six entities', () => {
      labelEntityTitle(0, 'Lorem Ipsum');
      cy.get('a[aria-label="Library"]').click();
      labelEntityTitle(1, 'Uwazi Heroes Investigation');
      cy.get('a[aria-label="Library"]').click();
      labelEntityTitle(2, 'The Lizard');
      cy.get('a[aria-label="Library"]').click();
      labelEntityTitle(3, 'Batman v Superman: Dawn of Justice');
      cy.get('a[aria-label="Library"]').click();
      labelEntityTitle(4, 'The Amazing Spider-Man');
      cy.get('a[aria-label="Library"]').click();
      labelEntityTitle(5, 'Spider-Man: Shattered Dimensions');
      cy.get('a[aria-label="Library"]').click();
      labelEntityTitle(6, 'The Spectacular Spider-Man');
      cy.get('a[aria-label="Library"]').click();
      labelEntityTitle(7, 'Spider-Man: Into the');
    });
  });

  describe('Dashboard', () => {
    before(() => {
      cy.injectAxe();
    });

    it('should navigate to the dashboard', () => {
      cy.get('.only-desktop a[aria-label="Settings"]').click();
      cy.contains('a', 'Metadata Extraction').click();
    });

    it('Should create an extractor', () => {
      cy.contains('button', 'Create Extractor').click();
      cy.getByTestId('modal').within(() => {
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
      cy.getByTestId('modal').within(() => {
        cy.get('input').type('Titles from all templates');
      });

      editPropertyForExtractor('ordenesDelPresidente', 'Ordenes del presidente', 'Title');
      cy.contains('button', 'From all templates').click();
      cy.contains('button', 'Add').click();
      cy.contains('td', 'Titles from all templates');
      cy.contains('button', 'Dismiss').click();
    });

    it('should disable the button to select all templates if no property is selected', () => {
      cy.contains('button', 'Create Extractor').click();
      cy.contains('button', 'From all templates').should('have.attr', 'disabled');

      editPropertyForExtractor('ordenesDelPresidente', 'Ordenes del presidente', 'Title');
      cy.contains('button', 'From all templates').should('not.have.attr', 'disabled');

      editPropertyForExtractor('ordenesDelPresidente', 'Ordenes del presidente', 'Title', true);
      cy.contains('button', 'From all templates').should('have.attr', 'disabled');

      cy.contains('button', 'Cancel').click();
    });

    it('should create another extractor selecting all templates with the relevant property', () => {
      cy.contains('button', 'Create Extractor').click();
      cy.getByTestId('modal').within(() => {
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

      cy.getByTestId('modal').within(() => {
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

      cy.getByTestId('modal').within(() => {
        cy.contains('li', 'Titles from all templates');
        cy.contains('button', 'Accept').click();
      });

      cy.contains('td', 'Titles from all templates').should('not.exist');
      cy.contains('button', 'Dismiss').click();
    });

    it('should check table display and accessibility', () => {
      cy.getByTestId('settings-ix').toMatchImageSnapshot();
      cy.checkA11y();
    });
  });

  describe('Review', () => {
    it('should navigate to the first extractor', () => {
      cy.contains('button', 'Review').eq(0).click();
    });

    it('should show title initial suggestion should be default', () => {
      cy.get('tbody tr').eq(5).should('be.visible');
      cy.contains('thead tr th:nth-child(2) div span', 'Document').click(); // Sort the results
      cy.get('tbody tr').eq(5).should('be.visible');
    });

    it('should find suggestions successfully', { defaultCommandTimeout: 6000 }, () => {
      cy.intercept('GET', 'api/suggestions*').as('getSuggestions');
      cy.get('table tr').should('have.length.above', 1);
      cy.contains('button', 'Find suggestions').click();
      cy.wait('@getSuggestions');
      cy.get('tbody tr').eq(5).should('be.visible');
    });

    it('should accept a single suggestion', () => {
      cy.intercept('POST', 'api/suggestions/accept').as('accept');
      cy.contains('button', 'Accept').eq(0).click();
      cy.wait('@accept');
    });

    it('should show filters sidepanel', () => {
      cy.intercept('GET', 'api/suggestions*').as('getSuggestions');
      cy.contains('button', 'Stats & Filters').click();
      cy.contains('span', 'Match').click();
      cy.contains('button', 'Apply').click();
      cy.wait('@getSuggestions');
      cy.get('tbody tr').should('have.length', 1);
    });
  });
});
