import {
  clearCookiesAndLogin,
  clickOnCreateEntity,
  clickOnEditEntity,
  saveEntity,
  selectRestrictedEntities,
} from './helpers';

describe('text references', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  it('should navigate to a document', () => {
    cy.contains(
      '.item-document',
      'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment. November 28, 2012'
    )
      .contains('View')
      .click();
    cy.contains('Previous');
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
      cy.contains(
        'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment. November 28, 2012'
      );
      cy.contains('Chile');
    });
  });

  it('should display relationships on the sidepanel', () => {
    cy.contains('a', 'Library').click();
    cy.contains(
      '.item-document:nth-child(1)',
      'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
    ).click();
    cy.get('#tab-relationships').click();
    cy.contains('#tabpanel-relationships', 'Relacionado a');
    cy.contains(
      '.sidepanel-relationship-right-entity',
      'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment. November 28, 2012'
    );
    cy.contains('.sidepanel-relationship-right-entity', 'Chile');
    cy.get('.metadata-sidepanel.is-active .closeSidepanel').eq(0).click();
  });

  it('should display entity relationship page', () => {
    cy.contains(
      '.item-document:nth-child(1)',
      'Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016'
    )
      .contains('View')
      .click();
    cy.get('#tab-relationships').click();
    cy.contains(
      'div.relationshipsHub:nth-child(1)',
      'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment. November 28, 2012'
    );
    cy.contains('div.relationshipsHub:nth-child(5)', 'Chile');
  });

  it('should display the related entity on the sidepanel', () => {
    cy.get('#tab-references').click();
    cy.contains(
      'aside.side-panel',
      'Artavia Murillo et al. Preliminary Objections, Merits, Reparations and Costs. Judgment. November 28, 2012'
    ).should('be.visible');
    cy.contains('aside.side-panel', 'Chile').should('be.visible');
  });

  it('should delete the reference to the entity', () => {
    cy.contains('aside.side-panel', 'Chile').click();
    cy.contains('.relationship-active', 'Chile').within(() => {
      cy.get('.btn.delete').click();
    });

    cy.contains('Confirm delete connection');
    cy.get('[data-testid=modal]').within(() => {
      cy.contains('Accept').click();
    });

    cy.waitForLegacyNotifications();

    cy.get('.metadata-sidepanel.is-active').within(() => {
      cy.contains('Artavia Murillo y otros. Resolución de la CorteIDH de 26 de febrero de 2016');
      cy.contains('Chile').should('not.exist');
    });
  });
});

describe('Entity with main documents', () => {
  it('Should create a new entity with a main documents', () => {
    cy.get('.metadata-sidepanel.is-active .closeSidepanel').eq(0).click();
    cy.contains('a', 'Library').click();
    cy.contains('Filters');
    selectRestrictedEntities();
    clickOnCreateEntity();
    cy.get('textarea[name="library.sidepanel.metadata.title"]').click();
    cy.get('textarea[name="library.sidepanel.metadata.title"]').type('Entity with main documents', {
      delay: 0,
    });
    cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').click();
    cy.get('input[name="library.sidepanel.metadata.metadata.resumen"]').type(
      'An entity with main documents',
      { delay: 0 }
    );
    cy.get('.document-list-parent > input').first().selectFile('./cypress/test_files/valid.pdf', {
      force: true,
    });
    saveEntity();
    cy.waitForLegacyNotifications();
  });

  it('should create a reference from main document', () => {
    cy.contains('.item-document', 'Entity with main documents').contains('View').click();
    cy.contains('span', 'La Sentencia de fondo');
    cy.get('#p3R_mc24 > span:nth-child(2)').realClick({ clickCount: 3 });
    cy.get('.fa-file', { timeout: 5000 }).then(() => {
      cy.get('.fa-file').realClick();
    });
    cy.contains('.create-reference', 'Relacionado a').should('be.visible');
    cy.contains('li.multiselectItem', 'Relacionado a').realClick();
    cy.get('aside.create-reference input').type('Patrick Robinson', { timeout: 5000 });
    cy.contains('Tracy Robinson', { timeout: 5000 });
    cy.contains('.item-name', 'Patrick Robinson', { timeout: 5000 }).realClick();
    cy.contains('aside.create-reference .btn-success', 'Save', { timeout: 5000 }).click({
      timeout: 5000,
    });
    cy.contains('Saved successfully.');
    cy.get('#p3R_mc0').scrollIntoView();
    cy.get('.row').toMatchImageSnapshot();
  });

  it('should edit the entity and the documents', () => {
    cy.contains('a', 'Library').click();
    cy.contains('.item-document', 'Entity with main documents').click();
    cy.contains('.metadata-type-text', 'An entity with main documents').click();
    clickOnEditEntity();
    cy.get('input[name="library.sidepanel.metadata.documents.0.originalname"]').click();
    cy.get('input[name="library.sidepanel.metadata.documents.0.originalname"]').clear();
    cy.get('input[name="library.sidepanel.metadata.documents.0.originalname"]').type(
      'Renamed file.pdf',
      { delay: 0 }
    );
    cy.get('.document-list-parent > input').first().selectFile('./cypress/test_files/invalid.pdf', {
      force: true,
    });
    saveEntity('Entity updated');
    cy.waitForLegacyNotifications();
    cy.contains('.item-document', 'Entity with main documents').click();
    cy.contains('.file-originalname', 'Renamed file.pdf').should('exist');
    cy.contains('.file-originalname', 'invalid.pdf').should('exist');
  });

  it('should delete the invalid document', () => {
    clickOnEditEntity();
    cy.get('.attachments-list > .attachment:nth-child(2) > button').click();
    cy.contains('button', 'Save').click();
    cy.contains('Entity updated');
    cy.waitForLegacyNotifications();
    cy.contains('.item-document', 'Entity with main documents').click();
    cy.contains('.file-originalname', 'Renamed file.pdf').should('exist');
    cy.contains('.file-originalname', 'invalid.pdf').should('not.exist');
  });

  it('should keep searched text between tabs', () => {
    cy.clearAndType(
      'input[aria-label="Type something in the search box to get some results."]',
      '"4 de julio de 2006"',
      { delay: 0 }
    );
    cy.get('svg[aria-label="Search button"]').click();
    cy.contains('.item-snippet', '4 de julio de 2006').should('have.length', 1);
    cy.contains('.item-document .item-actions a', 'View').click();
    cy.contains('VISTO');
    cy.get('.snippet-text').should('have.length', 2);
    cy.get('#tab-metadata').click();
    cy.get('.entity-sidepanel-tab-link').then(element => {
      expect(element.attr('href')).to.contain('searchTerm=%224%20de%20julio%20de%202006%22');
    });
    cy.contains('a', 'Library').click();
    cy.get('svg[aria-label="Reset Search input"]').click();
  });
});
