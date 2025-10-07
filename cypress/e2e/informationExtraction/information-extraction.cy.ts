/* eslint-disable max-statements */
/* eslint-disable max-lines */
import { clearCookiesAndLogin, editPropertyForExtractor } from '../helpers';
import 'cypress-axe';

const labelEntityTitle = (
  entityPos: number,
  selectValue: string,
  selector: string = 'span[role="presentation"]'
) => {
  cy.get('.view-doc').eq(entityPos).click();
  cy.contains(selector, selectValue).setSelection(selectValue);
  cy.get('button.edit-metadata').click();
  cy.get('button.extraction-button').first().click();
  cy.get('textarea[name="documentViewer.sidepanel.metadata.title"]')
    .invoke('val')
    .should('eq', selectValue);
  cy.get('button[type="submit"]').click();
  cy.get('div.alert-success').click();
};

const checkTemplatesList = (templates: string[]) => {
  templates.map(template => cy.getByTestId('pill-comp').contains(template));
};

describe('Information Extraction', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
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

    it('should create an extractor', () => {
      cy.contains('button', 'Create Extractor').click();
      cy.getByTestId('modal').within(() => {
        cy.get('input[id="extractor-name"]').type('Extractor 1', { delay: 0 });

        editPropertyForExtractor('Ordenes del presidente', 'Title');

        editPropertyForExtractor('Causa', 'Title');

        cy.contains('button', 'Next').click();
        cy.contains('Title');
        checkTemplatesList(['Ordenes del presidente', 'Causa']);
        cy.contains('button', 'Create').click();
      });

      cy.contains('td', 'Extractor 1');
      cy.contains('button', 'Dismiss').click();
    });

    it('should create another extractor selecting all templates', () => {
      cy.contains('button', 'Create Extractor').click();
      cy.getByTestId('modal').within(() => {
        cy.get('input[id="extractor-name"]').type('Titles from all templates', { delay: 0 });
        editPropertyForExtractor('Ordenes del presidente', 'Title');
        cy.contains('button', 'Select all').click();
        cy.contains('button', 'Next').click();
        checkTemplatesList([
          'Mecanismo',
          'Ordenes de la corte',
          'Informe de admisibilidad',
          'País',
          'Ordenes del presidente',
          'Causa',
          'Voto Separado',
          'Medida Provisional',
          'Sentencia de la corte',
          'Juez y/o Comisionado',
          'Reporte',
        ]);
        cy.contains('button', 'Create').click();
      });
      cy.contains('td', 'Titles from all templates');
      cy.contains('button', 'Dismiss').click();
    });

    it('should disable the button to select all templates if no property is selected', () => {
      cy.contains('button', 'Create Extractor').click();
      cy.getByTestId('modal').within(() => {
        cy.contains('button', 'Select all').should('not.exist');
        editPropertyForExtractor('Ordenes del presidente', 'Title');
        cy.contains('button', 'Select all').should('exist');
        editPropertyForExtractor('Ordenes del presidente', 'Title', false);
        cy.contains('button', 'Select all').should('not.exist');
        cy.contains('button', 'Cancel').click();
      });
    });

    it('should create another extractor selecting all templates with the relevant property', () => {
      cy.contains('button', 'Create Extractor').click();
      cy.getByTestId('modal').within(() => {
        cy.get('input[id="extractor-name"]').type('Fechas from relevant templates', { delay: 0 });

        editPropertyForExtractor('Ordenes de la corte', 'Fecha');
        cy.contains('button', 'Select all').click();
        cy.contains('button', 'Next').click();
        checkTemplatesList([
          'Ordenes de la corte',
          'Informe de admisibilidad',
          'Ordenes del presidente',
          'Sentencia de la corte',
        ]);
        cy.contains('button', 'Create').click();
      });
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
        cy.get('label[for="filter_true"]').click();
        cy.get('input[id="extractor-name"]').type(' edited', { delay: 0 });
        editPropertyForExtractor('Causa', 'Title', false);
        editPropertyForExtractor('Ordenes de la corte', 'Title');
        cy.contains('button', 'Next').click();
        checkTemplatesList(['Ordenes de la corte', 'Ordenes del presidente']);
        cy.contains('button', 'Update').click();
      });
      cy.contains('td', 'Extractor 1 edited');
      cy.contains('button', 'Dismiss').click();
    });

    it('should be able to filter templates', () => {
      cy.contains('button', 'Create Extractor').click();
      cy.getByTestId('modal').within(() => {
        cy.get('input[id="search-multiselect"]').type('ordenes', { delay: 0 });
        cy.contains('Ordenes de la corte');
        cy.contains('Ordenes del presidente');
        cy.contains('Cause').should('not.exist');
        cy.get('input[id="search-multiselect"]').clear();
        cy.contains('Cause').should('not.exist');
        cy.contains('button', 'Cancel').click();
      });
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
        cy.contains('button', 'Accept').should('be.disabled');
        cy.contains('button', 'Cancel').should('be.disabled');
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
        cy.get('input[id="extractor-name"]').type('Extractor 1', { delay: 0 });
        editPropertyForExtractor('Ordenes del presidente', 'Title');
        cy.contains('button', 'Next').click();
        cy.contains('button', 'Create').click();
      });

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

    it('should sort by the document column', () => {
      cy.get('tbody tr').eq(4).should('be.visible');
      cy.contains('th', 'Name').click();
      cy.contains('Lorem Ipsum (en)', { timeout: 100 });
      cy.get('tbody').within(() => {
        cy.get('tr')
          .eq(0)
          .contains(
            'Apitz Barbera y otros. Resolución de la Presidenta de 18 de diciembre de 2009 (en)'
          );
        cy.get('tr').eq(4).contains('The Spectacular Spider-Man (en)');
      });
    });

    it('should not display documents for languages that are not installed', () => {
      cy.contains('Uwazi Heroes Investigation').should('not.exist');
    });

    it('should display suggestions and be accessible', () => {
      cy.contains('Extractor 1 edited');
      cy.getByTestId('settings-ix').scrollTo('top', { ensureScrollable: false });
      cy.getByTestId('settings-content').toMatchImageSnapshot({
        disableTimersAndAnimations: true,
        threshold: 0.08,
      });
      cy.checkA11y();
    });

    it('should train the model and find suggestions', () => {
      cy.intercept('POST', 'api/suggestions/train').as('trainSuggestions');
      cy.get('table tr').should('have.length.above', 1);
      cy.checkA11y();
      cy.contains('button', 'Train model').click();
      cy.get('[data-testid="modal"]').within(() => {
        cy.contains('Find suggestions after training').click();
        cy.get('label[for="find.samplePolicy_marked_plus_labeled"]').click();
        cy.contains('button', 'Train').click();
      });
      cy.wait('@trainSuggestions');
      cy.contains('tr', 'obsolete').contains('button', 'Accept').should('be.disabled');
      cy.contains('2023');
    });

    it('should accept a single suggestion', () => {
      cy.contains('tr', 'Lorem Ipsum').contains('button', 'Accept').click();

      cy.contains('Suggestions sent');
      cy.contains('Suggestions have been updated');
      cy.contains('button', 'Dismiss').click();

      const titles = [
        '2023 (en)',
        'Apitz Barbera y otros. Resolución de la Presidenta de 18 de diciembre de 2009 (en)',
        'Batman v Superman: Dawn of Justice (en)',
        'Spider-Man: Shattered Dimensions (en)',
        'The Spectacular Spider-Man (en)',
        'Uwazi Heroes Investigation (other)',
      ];

      cy.get('tr > td:nth-child(2) > div').each((element, index) => {
        const text = element.get(0).innerText;
        expect(text).to.be.equal(`${titles[index]}`);
      });
    });

    it('should check for accessibility', () => {
      cy.contains('a', 'Metadata Extraction').click();
      cy.contains('tr', 'Extractor 1 edited').contains('a', 'Review').click();
      cy.checkA11y();
    });

    it('should use filters to get the only accepted suggestion', () => {
      cy.contains('button', 'Stats & Filters').click();
      cy.contains('label', 'Match').click();
      cy.contains('button', 'Apply').click();
      cy.get('tbody tr').should('have.length', 1);
      cy.contains('tr', '2023 (en)');
    });
  });

  describe('PDF sidepanel', () => {
    it('should display the PDF sidepanel with the pdf and selection rectangle', () => {
      cy.contains('button', 'Open').click();
      cy.contains('h1', '2023');
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
      cy.get('tbody tr').should('have.length', 5);
    });

    it('should click to fill with a new text', () => {
      cy.contains('a', 'Metadata Extraction').click();
      cy.contains('tr', 'Extractor 1 edited').contains('a', 'Review').click();
      cy.contains('tr', 'The Spectacular Spider-Man').within(() => {
        cy.contains('button', 'Open').click();
      });
      cy.get('aside').within(() => {
        cy.contains('h1', 'The Spectacular Spider-Man');
        cy.get('input').clear();
      });
      cy.contains('button', 'Clear').click();
      cy.contains('span[role="presentation"]', 'The Spectacular Spider-Man')
        .eq(0)
        .setSelection('The Spectacular Spider-Man');
      cy.contains('button', 'Click to fill').click();
      cy.get('div.highlight-rectangle').scrollIntoView();
      cy.get('div.highlight-rectangle').should('be.visible');
      cy.get('aside').within(() => {
        cy.get('input').should('have.value', 'The Spectacular Spider-Man');
      });
    });

    it('should manually edit the field, save, and mark the suggestion as used for training', () => {
      cy.get('aside').within(() => {
        cy.get('input').clear();
        cy.get('input').type('A title', { delay: 0 });
        cy.contains('button', 'Accept').click();
      });
      cy.contains('Saved successfully');
      cy.contains('button', 'Dismiss').click();
      cy.get('aside').should('not.exist');
      cy.contains('tr', 'A title (en)').contains('Remove from training set');
    });

    it('should open the pdf on the page of the selection', () => {
      cy.contains('a', 'Metadata Extraction').click();
      cy.contains('tr', 'Fechas from relevant templates').contains('a', 'Review').click();
      cy.contains(
        'tr',
        'Apitz Barbera y otros. Resolución de la Presidenta de 18 de diciembre de 2009'
      )
        .contains('button', 'Open')
        .click();
      cy.get('aside').within(() => {
        cy.get('input').should('have.value', '2018-12-01');
        cy.contains('New York City teenager Miles Morales');
        cy.contains('button', 'Cancel').click();
      });
    });
  });

  describe('Training set', () => {
    it('should navigate to another extractor', () => {
      cy.contains('a', 'Metadata Extraction').click();
      cy.contains('tr', 'Fechas from relevant templates').contains('a', 'Review').click();
    });

    it('should mark entities for training', () => {
      cy.intercept('POST', 'api/suggestions/training-set').as('addToSet');
      cy.contains('tr', 'A title (en)').contains('button', 'Add to training set').click();
      cy.wait('@addToSet');
      cy.contains('tr', 'Spider-Man: Shattered Dimensions (en)')
        .contains('button', 'Add to training set')
        .click();
      cy.wait('@addToSet');
      cy.contains('tr', 'The Amazing Spider-Man (en)')
        .contains('button', 'Add to training set')
        .click();
      cy.wait('@addToSet');
    });

    it('should remove one of the added entities', () => {
      cy.intercept('POST', 'api/suggestions/training-set').as('removeFromSet');
      cy.contains('button', 'Remove from training set').click();
      cy.wait('@removeFromSet');
    });
  });

  describe('auto accept', () => {
    it('should train a find suggestions', () => {
      cy.intercept('POST', 'api/suggestions/train').as('trainSuggestions');

      cy.contains('button', 'Train model').click();
      cy.get('[data-testid="modal"]').within(() => {
        cy.contains('Find suggestions after training').click();
        cy.contains('button', 'Train').click();
      });
      cy.wait('@trainSuggestions');
      cy.contains('tr', 'obsolete');
      cy.contains('February 3, 2020');
    });

    it('should select and auto accept for selection', () => {
      cy.contains('tr', '2023 (en)').contains('label', 'Select').click();
      cy.contains('tr', 'A title (en)').contains('label', 'Select').click();
      cy.contains('button', 'Process selected').click();
      cy.get('[data-testid="modal"]').within(() => {
        cy.contains('Auto-accept suggestions').click();
        cy.contains('For all entities').click();
        cy.contains('button', 'Process').click();
      });
      cy.contains('tr', '2023 (en)').contains(
        'span[class="text-left text-green-600"]',
        'February 3, 2020'
      );
      cy.contains('tr', 'A title (en)').contains(
        'span[class="text-left text-green-600"]',
        'February 3, 2020'
      );
    });

    it('should auto accept for all', () => {
      cy.contains('button', 'Process extractor').click();
      cy.get('[data-testid="modal"]').within(() => {
        cy.contains('Auto-accept suggestions').click();
        cy.contains('From all suggestions').click();
        cy.contains('For all entities').click();
        cy.contains('button', 'Process').click();
      });
      cy.contains(
        'tr',
        'Apitz Barbera y otros. Resolución de la Presidenta de 18 de diciembre de 2009 (en)'
      ).contains('span[class="text-left text-green-600"]', 'February 3, 2020');
      cy.contains('tr', 'Spider-Man: Shattered Dimensions (en)').contains(
        'span[class="text-left text-green-600"]',
        'February 3, 2020'
      );
      cy.contains('tr', 'Batman v Superman: Dawn of Justice (en)').contains(
        'span[class="text-left text-green-600"]',
        'February 3, 2020'
      );
      cy.contains('tr', 'The Amazing Spider-Man (en)').contains(
        'span[class="text-left text-green-600"]',
        'February 3, 2020'
      );
    });
  });
});
