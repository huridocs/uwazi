import type { DataRouter } from 'react-router';
import 'cypress-real-events';
import { mount } from 'cypress/react';
import { createRelationshipTypesSettingsTree } from './mountRelationshipTypesSettings.js';

const typeInInput = (selector: string, value: string) => {
  cy.get(selector).clear();
  cy.get(selector).type(value);
};

const clickFooterButton = (label: string) => {
  cy.get('[data-testid="settings-content-footer"]').contains('button', label).click();
};

const submitSidepanel = () => {
  cy.get('[data-testid="relationship-type-form-submit"]').click();
};

const editRowByLabel = (label: string) => {
  cy.contains('[data-testid="relationship-types"] tbody tr', label)
    .contains('button', 'Edit')
    .click();
};

const selectRowCheckbox = (label: string) => {
  cy.contains('[data-testid="relationship-types"] tbody tr', label)
    .find('input[type="checkbox"]')
    .realClick();
};

describe('Settings Relationship Types section CRUD', () => {
  describe('list', () => {
    let relationshipTypes: ReturnType<
      typeof createRelationshipTypesSettingsTree
    >['relationshipTypes'];
    let router: DataRouter;

    beforeEach(() => {
      const mounted = createRelationshipTypesSettingsTree('/settings/relationship-types');
      relationshipTypes = mounted.relationshipTypes;
      router = mounted.router;
      mount(mounted.tree);
    });

    it('loads relationship types through the list loader', () => {
      cy.get('[data-testid="settings-relationship-types"]').should('be.visible');
      cy.get('[data-testid="relationship-types"]').within(() => {
        cy.contains('Related to').should('be.visible');
        cy.contains('Mentions').should('be.visible');
        cy.contains('Based on').should('be.visible');
      });
    });

    it('disables deletion for relationship types used by templates', () => {
      cy.get('#reltype2').should('be.disabled');
    });

    it('deletes a deletable relationship type from the list', () => {
      selectRowCheckbox('Based on');
      cy.get('[data-testid="settings-content-footer"]').should('contain', 'Selected');
      cy.get('[data-testid="relationship-types-delete"]').realClick();
      cy.get('[data-testid="accept-button"]').click();
      cy.get('[data-testid="modal"]').should('not.exist');

      cy.wrap(router.revalidate());
      cy.get('[data-testid="relationship-types"] tbody').should('not.contain', 'Based on');
      cy.wrap(null).then(() => {
        expect(
          relationshipTypes
            .snapshot()
            .map(item => item._id)
            .sort()
        ).to.deep.equal(['reltype1', 'reltype2']);
      });
    });
  });

  describe('create and edit', () => {
    let relationshipTypes: ReturnType<
      typeof createRelationshipTypesSettingsTree
    >['relationshipTypes'];
    let router: DataRouter;

    beforeEach(() => {
      const mounted = createRelationshipTypesSettingsTree('/settings/relationship-types');
      relationshipTypes = mounted.relationshipTypes;
      router = mounted.router;
      mount(mounted.tree);
    });

    it('creates a relationship type from the sidepanel', () => {
      clickFooterButton('Add relationship type');
      typeInInput('#relationship-type-name', 'Cites');
      submitSidepanel();

      cy.wrap(router.revalidate());
      cy.get('[data-testid="relationship-types"] tbody').should('contain', 'Cites');
      cy.wrap(null).then(() => {
        expect(relationshipTypes.snapshot().map(item => item.name)).to.include('Cites');
      });
    });

    it('edits a relationship type from the sidepanel', () => {
      editRowByLabel('Related to');
      typeInInput('#relationship-type-name', 'Related to (updated)');
      submitSidepanel();

      cy.wrap(router.revalidate());
      cy.get('[data-testid="relationship-types"] tbody').should('contain', 'Related to (updated)');
      cy.wrap(null).then(() => {
        expect(relationshipTypes.snapshot().find(item => item._id === 'reltype1')?.name).to.equal(
          'Related to (updated)'
        );
      });
    });
  });
});
