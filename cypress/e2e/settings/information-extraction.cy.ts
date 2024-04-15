/* eslint-disable max-statements */
/* eslint-disable max-lines */
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
    cy.exec('yarn ix-config', { env });
    clearCookiesAndLogin();
  });

  describe('labeling entities', () => {
    // eslint-disable-next-line max-statements
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

    it('should disable buttons while saving', () => {
      cy.intercept('POST', '/api/ixextractors', { delay: 100 });

      cy.contains('button', 'Create Extractor').click();
      cy.getByTestId('modal').within(() => {
        cy.get('input').type('Extractor 1');
      });
      editPropertyForExtractor('firstTemplate', 'Ordenes del presidente', 'Title');
      cy.contains('button', 'Add').click();
      cy.contains('button', 'Create Extractor').should('have.attr', 'disabled');
      cy.contains('button', 'Dismiss').click();
    });
  });

  describe('Suggestions review', () => {
    before(() => {
      cy.injectAxe();
    });

    it('should navigate to the first extractor', () => {
      cy.contains('button', 'Review').eq(0).click();
    });

    it('should show title initial suggestion should be default', () => {
      cy.get('tbody tr').eq(5).should('be.visible');
      cy.contains('thead tr th:nth-child(2) div span', 'Document').click();
      cy.contains('Uwazi Heroes Investigation', { timeout: 100 });
    });

    it('should display suggestions and be accessible', () => {
      cy.contains('Batman v Superman: Dawn of Justice');
      cy.getByTestId('settings-content').toMatchImageSnapshot({
        disableTimersAndAnimations: true,
        threshold: 0.08,
      });
      cy.checkA11y();
    });

    it('should find suggestions successfully', () => {
      cy.intercept('POST', 'api/suggestions/train').as('trainSuggestions');
      cy.get('table tr').should('have.length.above', 1);
      cy.checkA11y();
      cy.contains('button', 'Find suggestions').click();
      cy.wait('@trainSuggestions');
      cy.contains('Training model...');
      cy.contains('2023');
    });

    it('should accept a single suggestion without affecting the order', () => {
      cy.contains('Lorem Ipsum').parent().siblings().contains('button', 'Accept').click();

      cy.contains('Suggestion accepted.');
      cy.contains('button', 'Dismiss').click();

      const titles = [
        'Apitz Barbera y otros. Resolución de la Presidenta de 18 de diciembre de 2009',
        'Batman v Superman: Dawn of Justice',
        '2023',
        'Spider-Man: Shattered Dimensions',
        'The Spectacular Spider-Man',
        'Uwazi Heroes Investigation',
      ];

      cy.get('tr > td:nth-child(2) > div').each((element, index) => {
        const text = element.get(0).innerText;
        expect(text).to.be.equal(titles[index]);
      });

      cy.checkA11y();
    });

    it('should use filters', () => {
      cy.intercept('GET', 'api/suggestions*').as('getSuggestions');
      cy.contains('button', 'Stats & Filters').click();
      cy.checkA11y();
      cy.contains('span', 'Match').click();
      cy.contains('button', 'Apply').click();
      cy.wait('@getSuggestions');
      cy.get('tbody tr').should('have.length', 1);
    });
  });

  describe('PDF sidepanel', () => {
    it('should display the PDF sidepanel with the pdf and selection rectangle', () => {
      cy.contains('button', 'Open PDF').click();
      cy.contains('h1', 'SamplePDF.pdf');
      cy.get('aside').within(() => {
        cy.get('input').should('have.value', '2023');
      });
      cy.get('div.highlight-rectangle').should('be.visible');
      cy.contains('span', 'Lorem Ipsum');
    });

    it('should not render pdf pages that are not visible', () => {
      cy.get('[data-region-selector-id="2"]').within(() => {
        cy.get('div').should('be.empty');
      });
    });

    it('should clear the existing selection', () => {
      cy.contains('[data-testid="ix-clear-button-container"] button', 'Clear').click();
      cy.get('div.highlight-rectangle').should('have.length', 0);
    });

    it('should clear the filters', () => {
      cy.contains('button', 'Cancel').click();
      cy.contains('button', 'Stats & Filters').click();
      cy.contains('button', 'Clear all').click();
    });

    it('should click to fill with a new text', () => {
      cy.contains('The Spectacular Spider-Man').parent().siblings().last().click();
      cy.get('aside').within(() => {
        cy.get('input').clear();
      });
      cy.get('#pdf-container').scrollTo(0, 0);
      cy.contains('button', 'Clear').click();
      cy.contains('span[role="presentation"]', 'The Spectacular Spider-Man')
        .eq(0)
        //@ts-ignore
        .setSelection('The Spectacular Spider-Man');

      cy.contains('button', 'Click to fill').click();
      cy.get('div.highlight-rectangle').should('be.visible');
      cy.get('aside').within(() => {
        cy.get('input').should('have.value', 'The Spectacular Spider-Man');
      });
    });

    it('should manually edit the field and save', () => {
      cy.get('aside').within(() => {
        cy.get('input').clear();
        cy.get('input').type('A title');
        cy.contains('button', 'Accept').click();
      });
      cy.contains('Saved successfully');
      cy.contains('button', 'Dismiss').click();
      cy.contains('A title');
    });

    it('should check that the table updated and the ordering is not affected', () => {
      const titles = [
        '2023',
        'Apitz Barbera y otros. Resolución de la Presidenta de 18 de diciembre de 2009',
        'Batman v Superman: Dawn of Justice',
        'Spider-Man: Shattered Dimensions',
        'A title',
        'Uwazi Heroes Investigation',
      ];

      cy.get('tr > td:nth-child(2) > div').each((element, index) => {
        const text = element.get(0).innerText;
        expect(text).to.be.equal(titles[index]);
      });
    });

    it('should open the pdf on the page of the selection', () => {
      cy.contains('a', 'Metadata Extraction').eq(0).click();
      cy.contains('Fechas from relevant templates').siblings().last().click();
      cy.contains('Apitz Barbera y otros. Resolución de la Presidenta de 18 de diciembre de 2009')
        .parent()
        .siblings()
        .last()
        .click();
      cy.get('aside').within(() => {
        cy.get('input').should('have.value', '2018-12-01');
        cy.contains('New York City teenager Miles Morales');
      });
    });
  });
});
