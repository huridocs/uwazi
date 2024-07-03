import { clearCookiesAndLogin } from './helpers/login';

const mainSearchResults = [
  'Artavia Murillo et al',
  'Artavia Murillo y otros',
  'Artavia Murillo and others. Admissibility Report N° 25/04',
  'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment.',
  'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016',
  'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014',
  'Artavia Murillo y otros. Resolución del Presidente de la Corte de 6 de agosto de 2012',
  'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment.',
  'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment.',
];

describe('full text search', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  it('should show text snippets when performing a text search', () => {
    cy.get('input[aria-label="Type something in the search box to get some results."]').clear();
    cy.get('input[aria-label="Type something in the search box to get some results."]').type(
      'Artavia Murillo',
      { delay: 0 }
    );
    cy.get('svg[aria-label="Search button"]').click();

    cy.get('.item-snippet').should('have.length', '9');

    mainSearchResults.forEach(result => {
      cy.contains('.item-snippet', result);
    });
  });

  it('should open the snippets tab on the sidePanel', () => {
    cy.contains('div', 'Artavia Murillo y otros').click();
    cy.get('#tabpanel-text-search').within(() => {
      cy.contains('.snippet-list-item-header', 'Title');
      cy.contains('.snippet-list-item', 'Artavia Murillo y otros');
    });
  });

  it('should enter a document via the search results', () => {
    cy.contains(
      '.item-name',
      'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014'
    );

    cy.get('input[aria-label="Type something in the search box to get some results."]').clear();
    cy.get('input[aria-label="Type something in the search box to get some results."]').type(
      'Mauris\u000d',
      { delay: 0 }
    );

    cy.contains('.item-snippet-source', 'Document contents');
    cy.contains('.item-snippet', 'maecenas ligula nostra, accumsan taciti. Sociis mauris').click();

    cy.get('#tabpanel-text-search').within(() => {
      cy.get('.snippet-list-item').should('have.length', 3);
      cy.get('.snippet-list-item').eq(0).click();
    });

    cy.contains('Uwazi Heroes Investigation');
  });

  it('should perform another search', () => {
    cy.get('#tab-text-search').click();
    cy.get('input[aria-label="Type something in the search box to get some results."]').type(
      'Uwazi heroes\u000d',
      { delay: 0 }
    );
    cy.contains('.snippet-text', 'Uwazi Heroes Investigation');
  });
});
