import { clearCookiesAndLogin } from './helpers';

describe('text references', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  it('should navigate to a document', () => {
    cy.contains(
      'h2',
      'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment. November 28, 2012'
    )
      .parentsUntil('.item-document')
      .parent()
      .contains('a', 'View')
      .click();
  });

  it('should select the title and create a reference to another paragraph', () => {
    cy.contains('span[role="presentation"]', 'The Amazing Spider-Man').setSelection(
      'The Amazing Spider-Man'
    );

    cy.get('.connect-to-p').click();

    cy.get('.create-reference.is-active').within(() => {
      cy.contains('Relacionado a').click();
      cy.get('input').type(
        'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016\u000d',
        { delay: 0 }
      );
      cy.contains(
        'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
      ).click();
      cy.get('.btn-success').click();
    });

    cy.contains('span[role="presentation"]', 'What is Lorem Ipsum?').setSelection(
      'What is Lorem Ipsum?'
    );

    cy.get('.ContextMenu > .btn').click();
  });

  it('should verify the reference and navigate to the connected paragraph', () => {
    cy.get('.metadata-sidepanel.is-active').within(() => {
      cy.contains(
        'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
      ).click();

      cy.get('.item-shortcut.btn-default').eq(1).click();
    });

    cy.contains('Lorem Ipsum');
  });

  it('should create a reference to another entity', () => {
    cy.contains('span[role="presentation"]', 'Why do we use it?').setSelection('Why do we use it?');

    cy.get('.connect-to-d').click();

    cy.get('.create-reference.is-active').within(() => {
      cy.contains('Paises').click();
      cy.get('input').type('Chile\u000d', { delay: 0 });
      cy.contains('Chile').click();
      cy.contains('button', 'Save').click();
    });
  });

  it('should verify the reference to an entity', () => {
    cy.get('.metadata-sidepanel.is-active').within(() => {
      cy.contains('Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016');
      cy.contains('Chile');
    });
  });

  it('should delete the reference to the entity', () => {
    cy.contains('.relationship-active', 'Chile').within(() => {
      cy.get('.btn.delete').click();
    });

    cy.contains('Confirm delete connection');
    cy.get('[data-testid=modal]').within(() => {
      cy.contains('Accept').click();
    });

    cy.get('.metadata-sidepanel.is-active').within(() => {
      cy.contains('Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016');
      cy.contains('Chile').should('not.exist');
    });
  });
});
