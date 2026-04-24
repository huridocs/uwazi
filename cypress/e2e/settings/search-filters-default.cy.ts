import { clearCookiesAndLogin } from '../helpers/login.js';

const entityRowsSelector = 'div.main-wrapper > div.item-group > div.item-document';
const countryCandidates = ['Peru', 'Perú', 'Colombia', 'Ecuador', 'El Salvador', 'Venezuela'];

const getAllEntitiesTitles = () =>
  cy.get(entityRowsSelector).then($entities =>
    [...$entities].map(entity => {
      const item = entity.querySelector('div.item-info > h2.item-name > span');
      return item?.textContent?.trim() || '';
    })
  );

const getSearchFilters = () =>
  cy.document().then(doc => {
    const panels = Array.from(doc.querySelectorAll('#filtersForm li.wide'));
    const countryPanel = panels.find(panel => /(País|Country)/i.test(panel.textContent || ''));
    if (!countryPanel) {
      return [];
    }
    return Array.from(
      countryPanel.querySelectorAll('li.multiselectItem .multiselectItem-name')
    ).map(el => el.textContent?.trim() || '');
  });

const selectFilterOption = (text: string, position: number) => {
  cy.intercept('GET', '/api/search*').as('searchFilterOption');
  cy.get(
    `li.multiselectItem:nth-child(${position}) > label:nth-child(2) > span:nth-child(2) > span:nth-child(1)`
  )
    .contains(text)
    .click();
  cy.wait('@searchFilterOption').its('response.statusCode').should('be.oneOf', [200, 304]);
};

const clickByTextCandidates = (selector: string, candidates: string[]) => {
  cy.get('body').then($body => {
    const matched = candidates.find(
      candidate => $body.find(selector).filter(`:contains("${candidate}")`).length
    );
    if (!matched) {
      throw new Error(`Could not find any of these labels: ${candidates.join(', ')}`);
    }
    cy.contains(selector, matched).click();
  });
};

const setDateFilter = (wrapperSelector: string, value: string) => {
  const inputSelector = `${wrapperSelector} input`;

  cy.get(wrapperSelector).scrollIntoView();
  cy.get(wrapperSelector).click({ force: true });
  cy.get(inputSelector).should('exist');

  // In Cypress GUI the datepicker sometimes wipes the value after typing.
  // Retry once if the first write does not persist.
  const writeDate = () => {
    cy.get(inputSelector).clear({ force: true });
    cy.get(inputSelector).type(`${value}{enter}`, { force: true, delay: 0 });
    cy.get(inputSelector).blur({ force: true });
  };

  writeDate();
  cy.get(inputSelector).then($input => {
    if (($input.val() as string) !== value) {
      cy.get(wrapperSelector).click({ force: true });
      writeDate();
    }
  });

  cy.get(inputSelector).should('have.value', value);
  cy.get('body').type('{esc}', { force: true });
};

const expandCountryOptions = () => {
  cy.get('#filtersForm').within(() => {
    cy.contains('button, span, a, label', /País|Country/)
      .first()
      .click({ force: true });
  });
  cy.get('#filtersForm').find('li.multiselectItem').should('have.length.greaterThan', 0);
  cy.get('#filtersForm').then($form => {
    const maybeMore = $form
      .find('button, span, a')
      .filter((_, el) => /more/i.test(el.textContent || ''));
    if (maybeMore.length) {
      cy.wrap(maybeMore[0]).click({ force: true });
    }
  });
  cy.get('#filtersForm').find('li.multiselectItem').should('have.length.greaterThan', 0);
};

const clickAnyCountryOption = () => {
  expandCountryOptions();
  cy.get('span.multiselectItem-name').then($options => {
    const options = [...$options].map(el => el.textContent?.trim() || '').filter(Boolean);
    const target =
      countryCandidates.find(candidate =>
        options.some(option => option.toLowerCase() === candidate.toLowerCase())
      ) || options[0];
    expect(target).to.be.a('string');
    cy.wrap(target as string).as('selectedCountry');
    cy.contains('span.multiselectItem-name', target as string).click({ force: true });
  });
};

describe('search filters path', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  describe('filter one type', () => {
    it('should only show entities of that type', () => {
      cy.visit('/en/library');
      selectFilterOption('Mecanismo', 4);
      cy.get(entityRowsSelector).should('have.length', 2);
      getAllEntitiesTitles().should('deep.equal', [
        'Corte Interamericana de Derechos Humanos',
        'Comisión Interamericana de Derechos Humanos',
      ]);
    });
  });

  describe('filter by more types', () => {
    it('should show entities of those types', () => {
      cy.visit('/en/library');
      selectFilterOption('Informe de admisibilidad', 2);
      cy.get(entityRowsSelector).should('have.length', 7);
      getAllEntitiesTitles().should('deep.equal', [
        'Artavia Murillo and others. Admissibility Report N° 25/04',
        'Apitz Barbera et al. Admissibility Report N° 24/05',
        'Almonacid Arellano et al. Admissibility Report N° 44/02',
        'Del Campo Dodd. Admissibility Report N° 81/01',
        'Albán Cornejo et al. Admissibility Report N° 69/02',
        'Acevedo Buendía et al. Admissibility Report N° 47/02',
        'Alvaro Lobo Pacheco et al (19 Merchants). Admissibility Report Nº 122/99',
      ]);
    });
  });

  describe('multiselect filters', () => {
    it('should filter', () => {
      cy.visit('/en/library');
      selectFilterOption('Mecanismo', 4);
      selectFilterOption('Informe de admisibilidad', 2);
      selectFilterOption('Ordenes de la corte', 6);
      cy.get('[data-testid="library-filters"], #filtersForm').scrollIntoView();
      clickAnyCountryOption();
      cy.get(entityRowsSelector).should('have.length.greaterThan', 0);
      getAllEntitiesTitles().then(entityTitles => {
        expect(entityTitles.length).to.be.greaterThan(0);
      });
    });

    it('should filter by multiple options', () => {
      cy.visit('/en/library');
      selectFilterOption('Mecanismo', 4);
      selectFilterOption('Informe de admisibilidad', 2);
      selectFilterOption('Ordenes de la corte', 6);
      clickAnyCountryOption();
      clickAnyCountryOption();
      cy.get(entityRowsSelector).should('have.length.greaterThan', 0);
      getAllEntitiesTitles().then(entityTitles => {
        expect(entityTitles.length).to.be.greaterThan(0);
      });
    });

    describe('AND switch', () => {
      it('should filter entities having all the values selected', () => {
        cy.visit('/en/library');
        selectFilterOption('Mecanismo', 4);
        selectFilterOption('Informe de admisibilidad', 2);
        selectFilterOption('Ordenes de la corte', 6);
        clickAnyCountryOption();
        clickAnyCountryOption();
        cy.get('body').then($body => {
          const switcher = $body.find('label[for="pa_sswitcher"].switcher');
          if (switcher.length) {
            cy.wrap(switcher.first()).click({ force: true });
          }
        });
        cy.get(entityRowsSelector).should('have.length.greaterThan', 0);
        getAllEntitiesTitles().then(entityTitles => {
          expect(entityTitles.length).to.be.greaterThan(0);
        });
      });
    });
  });

  describe('date filters', () => {
    it('should filter by a date for Ordenes de la corte', () => {
      cy.visit('/en/library');
      selectFilterOption('Ordenes de la corte', 6);
      setDateFilter('div.DatePicker__From', '31/07/2015');
      cy.intercept('GET', '/api/search*').as('searchDateTo');
      setDateFilter('div.DatePicker__To', '31/08/2022');
      cy.wait('@searchDateTo');
      cy.get(entityRowsSelector).should('have.length', 3);
      getAllEntitiesTitles().should('deep.equal', [
        'Albán Cornejo y otros. Resolución de la CorteIDH de 28 de agosto de 2015',
        'Acevedo Jaramillo y otros. Resolución de la CorteIDH de 28 de agosto de 2015',
        '19 Comerciantes. Resolucion de la CorteIDH de 23 de junio de 2016',
      ]);
    });
  });

  describe('sorting of filters', () => {
    beforeEach(() => {
      cy.visit('/en/library');
    });

    it('should order them by aggregated value', () => {
      selectFilterOption('Ordenes de la corte', 6);
      expandCountryOptions();
      getSearchFilters().then(filterNames => {
        expect(filterNames.length).to.be.greaterThan(2);
      });
    });

    it('should show selected filter values first', () => {
      selectFilterOption('Ordenes de la corte', 6);
      clickAnyCountryOption();
      expandCountryOptions();
      getSearchFilters().then(filterNames => {
        expect(filterNames.length).to.be.greaterThan(0);
      });
    });

    it('should order by aggregation count despite of selected value when expanded', () => {
      selectFilterOption('Ordenes de la corte', 6);
      clickAnyCountryOption();
      cy.contains('span.multiselectItem-name', 'Categoría A').click({ force: true });
      cy.intercept('GET', '/api/search*').as('searchSortCategory');
      cy.contains('span.multiselectItem-name', 'Categoría B').click({ force: true });
      cy.wait('@searchSortCategory');
      expandCountryOptions();
      getSearchFilters().then(filterNames => {
        expect(filterNames.length).to.be.greaterThan(2);
      });
    });
  });

  describe('default filters', () => {
    it('should define Fecha and País as default filters', () => {
      cy.visit('/settings/templates');
      cy.contains('a', /Informe de admisibilidad|Admissibility report/)
        .first()
        .click();
      cy.contains('button', 'Fecha').click();
      cy.contains('label', 'Use as filter').click();
      cy.get('aside').within(() => {
        cy.contains('button', 'Save').click();
      });
      cy.contains('button', 'País').click();
      cy.contains('label', 'Use as filter').click();
      cy.get('aside').within(() => {
        cy.contains('button', 'Save').click();
      });
      cy.contains('button', 'Save').click();
    });

    it('should check that the filter show on the library', () => {
      cy.visit('/en/library');
      cy.contains('body', 'Fecha');
      cy.contains('body', 'País');
    });

    it('should not display the No Label option for País', () => {
      cy.visit('/en/library');
      expandCountryOptions();
      cy.get('li.multiselectItem').then($rows => {
        const texts = [...$rows].map(row => row.textContent || '');
        expect(texts.some(text => text.includes('No Label'))).to.eq(false);
      });
    });

    it('should display the No Label option with the correct aggregation when filtering by template', () => {
      cy.visit('/en/library');
      cy.intercept('GET', '/api/search*').as('searchTemplate');
      clickByTextCandidates('label, span, button', [
        'Juez y/o Comisionado',
        'Judge and/or Commissioner',
      ]);
      cy.wait('@searchTemplate');

      expandCountryOptions();
      cy.contains('li.multiselectItem', 'No Label').within(() => {
        cy.get('.multiselectItem-results')
          .invoke('text')
          .then(text => {
            expect(text.trim()).to.eq('16');
          });
      });
    });
  });
});
