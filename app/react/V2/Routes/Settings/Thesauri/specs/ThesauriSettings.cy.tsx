import type { DataRouter } from 'react-router';
import 'cypress-real-events';
import { mount } from 'cypress/react';
import { createThesauriSettingsTree } from './mountThesauriSettings.js';

const typeInInput = (selector: string, value: string, index = 0) => {
  cy.get(selector).eq(index).clear();
  cy.get(selector).eq(index).type(value);
};

const expectPathname = (router: DataRouter, pathname: string | RegExp) => {
  cy.wrap(router)
    .its('state.location.pathname')
    .should(typeof pathname === 'string' ? 'eq' : 'match', pathname);
};

const clickSave = () => {
  cy.get('[data-testid="settings-content-footer"]').contains('button', 'Save').click();
};

const openNewThesaurus = () => {
  cy.contains('button', 'Add thesaurus').click();
  cy.get('[data-testid="settings-thesauri"]').should('be.visible');
  cy.get('#thesauri-name').should('be.visible');
};

const submitItemSidepanel = (title: string, secondTitle?: string) => {
  cy.get('form#value-thesauri-form').within(() => {
    typeInInput('input[type="text"]', title, 0);
    if (secondTitle) {
      cy.get('input[type="text"]').should('have.length.at.least', 2);
      typeInInput('input[type="text"]', secondTitle, 1);
    }
    cy.get('[data-testid="thesaurus-form-submit"]').click();
  });
};

const submitGroupSidepanel = (groupName: string, childName: string) => {
  cy.get('form#group-thesauri-form input[type="text"]').should('have.length.at.least', 2);
  typeInInput('form#group-thesauri-form input[type="text"]', groupName, 0);
  typeInInput('form#group-thesauri-form input[type="text"]', childName, 1);
  cy.get('form#group-thesauri-form input[type="text"]').should('have.length.at.least', 3);
  cy.get('form#group-thesauri-form [data-testid="thesaurus-form-submit"]').click();
};

const editRowByLabel = (label: string) => {
  cy.contains('[data-testid="thesauri"] tbody tr', label).contains('button', 'Edit').click();
};

const selectRowCheckbox = (label: string) => {
  cy.contains('[data-testid="thesauri"] tbody tr', label)
    .find('input[type="checkbox"]')
    .realClick();
};

const clickFooterButton = (label: string) => {
  cy.get('[data-testid="settings-content-footer"]').contains('button', label).click();
};

const expandAllGroups = () => {
  cy.contains('button', 'Expand all').then($button => {
    if (!$button.is(':disabled')) {
      cy.wrap($button).click();
    }
  });
};

describe('Settings Thesauri section CRUD', () => {
  describe('list', () => {
    let thesauri: ReturnType<typeof createThesauriSettingsTree>['thesauri'];
    let router: ReturnType<typeof createThesauriSettingsTree>['router'];

    beforeEach(() => {
      const mounted = createThesauriSettingsTree('/settings/thesauri');
      thesauri = mounted.thesauri;
      router = mounted.router;
      mount(mounted.tree);
    });

    it('loads thesauri through the list loader', () => {
      cy.get('[data-testid="settings-thesauri"]').should('be.visible');
      cy.get('[data-testid="thesauri"]').within(() => {
        cy.contains('Animals').should('be.visible');
        cy.contains('Colors').should('be.visible');
        cy.contains('Names').should('be.visible');
      });
    });

    it('disables deletion for thesauri used by templates', () => {
      cy.get('#thesaurus2').should('be.disabled');
    });

    it('deletes a deletable thesaurus from the list', () => {
      cy.contains('[data-testid="thesauri"] tbody tr', 'Animals')
        .find('input[type="checkbox"]')
        .realClick();
      cy.get('[data-testid="settings-content-footer"]').should('contain', 'Selected');
      cy.get('[data-testid="thesaurus-delete-link"]').realClick();
      cy.get('[data-testid="accept-button"]').click();
      cy.get('[data-testid="modal"]').should('not.exist');

      cy.wrap(router.revalidate());
      cy.get('[data-testid="thesauri"] tbody').should('not.contain', 'Animals');
      cy.wrap(null).then(() => {
        expect(
          thesauri
            .snapshot()
            .map(item => item._id)
            .sort()
        ).to.deep.equal(['thesaurus1', 'thesaurus2']);
      });
    });
  });

  describe('create and edit flow', () => {
    let thesauri: ReturnType<typeof createThesauriSettingsTree>['thesauri'];
    let router: ReturnType<typeof createThesauriSettingsTree>['router'];

    beforeEach(() => {
      const mounted = createThesauriSettingsTree('/settings/thesauri');
      thesauri = mounted.thesauri;
      router = mounted.router;
      mount(mounted.tree);
    });

    it('performs the full create and edit CRUD flow', () => {
      openNewThesaurus();
      expectPathname(router, '/settings/thesauri/new');

      cy.get('#thesauri-name').clear();
      cy.get('#thesauri-name').type('new thesaurus');

      clickFooterButton('Add item');
      submitItemSidepanel('single value 1', 'single value 2');
      cy.get('[data-testid="thesauri"] tbody').should('contain', 'single value 1');
      cy.get('[data-testid="thesauri"] tbody').should('contain', 'single value 2');

      clickFooterButton('Add group');
      submitGroupSidepanel('Group 1', 'Child 1');
      cy.get('[data-testid="thesauri"] tbody').should('contain', 'Group 1');
      expandAllGroups();
      cy.get('[data-testid="thesauri"] tbody').should('contain', 'Child 1');

      clickFooterButton('Add group');
      cy.get('[data-testid="thesaurus-form-submit"]').click();
      cy.contains('This field is required').should('be.visible');
      cy.get('[data-testid="thesaurus-form-cancel"]').click();

      clickFooterButton('Add item');
      cy.get('[data-testid="thesaurus-form-submit"]').click();
      cy.get('[data-testid="thesauri"] tbody').should('contain', 'Group 1');

      clickFooterButton('Add item');
      cy.get('form#value-thesauri-form').within(() => {
        typeInInput('input[type="text"]', 'new child 2', 0);
        cy.get('select#item-group').first().select('Group 1');
        cy.get('[data-testid="thesaurus-form-submit"]').click();
      });
      cy.get('[data-testid="thesauri"] tbody').should('contain', 'new child 2');

      cy.contains('button', 'Cancel').click();
      cy.contains('Discard changes').should('be.visible');
      cy.get('[data-testid="modal"]').contains('button', 'Cancel').click();

      clickSave();
      expectPathname(router, /\/settings\/thesauri\/edit\/testing-thesaurus-\d+$/);

      let createdThesaurusId = '';
      cy.wrap(null).then(() => {
        const saved = thesauri.snapshot().find(item => item.name === 'new thesaurus');
        expect(saved).to.not.equal(undefined);
        createdThesaurusId = saved!._id;
        expect(saved!.values.map(value => value.label)).to.deep.equal([
          'single value 1',
          'single value 2',
          'Group 1',
        ]);
      });

      cy.get('[data-testid="settings-thesauri"]').should('contain', 'new thesaurus');
      cy.get('#thesauri-name').should('have.value', 'new thesaurus');
      expandAllGroups();
      cy.get('[data-testid="thesauri"] tbody').should('contain', 'Child 1');

      editRowByLabel('single value 1');
      cy.get('form#value-thesauri-form').within(() => {
        typeInInput('input[type="text"]', 'MODIFIED SINGLE VALUE', 0);
        cy.get('[data-testid="thesaurus-form-submit"]').click();
      });
      cy.get('[data-testid="thesauri"] tbody').should('contain', 'MODIFIED SINGLE VALUE');
      clickSave();
      cy.wrap(router.revalidate());
      cy.wrap(null).then(() => {
        const saved = thesauri.snapshot().find(item => item._id === createdThesaurusId);
        expect(saved?.values.some(value => value.label === 'MODIFIED SINGLE VALUE')).to.equal(true);
      });

      editRowByLabel('Group 1');
      cy.get('form#group-thesauri-form').within(() => {
        typeInInput('input[type="text"]', 'CHANGED GROUP', 0);
        cy.get('input[type="text"]').last().clear();
        cy.get('input[type="text"]').last().type('ADDED CHILD');
        cy.get('[data-testid="thesaurus-form-submit"]').click();
      });
      clickSave();
      expandAllGroups();
      cy.get('[data-testid="thesauri"] tbody').should('contain', 'CHANGED GROUP');
      cy.get('[data-testid="thesauri"] tbody').should('contain', 'ADDED CHILD');

      selectRowCheckbox('single value 2');
      expandAllGroups();
      selectRowCheckbox('Child 1');
      cy.get('[data-testid="thesauri-remove-button"]').click();
      cy.get('[data-testid="thesauri"] tbody').should('not.contain', 'single value 2');
      cy.get('[data-testid="thesauri"] tbody').should('not.contain', 'Child 1');
      clickSave();

      clickFooterButton('Sort');
      clickSave();
      cy.wrap(null).then(() => {
        const saved = thesauri.snapshot().find(item => item._id === createdThesaurusId);
        expect(saved?.values[0]?.label).to.equal('CHANGED GROUP');
        expect(saved?.values[1]?.label).to.equal('MODIFIED SINGLE VALUE');
      });
    });
  });

  describe('edit existing from list', () => {
    let router: ReturnType<typeof createThesauriSettingsTree>['router'];

    beforeEach(() => {
      const mounted = createThesauriSettingsTree('/settings/thesauri');
      router = mounted.router;
      mount(mounted.tree);
    });

    it('opens an existing thesaurus from the list route', () => {
      cy.get('[data-testid="thesauri"] tbody').should('contain', 'Colors');
      cy.contains('[data-testid="thesauri"] tbody tr', 'Colors').contains('button', 'Edit').click();
      expectPathname(router, '/settings/thesauri/edit/thesaurus1');
      cy.get('#thesauri-name').should('have.value', 'Colors');
    });
  });
});
