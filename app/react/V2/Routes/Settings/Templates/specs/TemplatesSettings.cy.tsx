import type { DataRouter } from 'react-router';
import 'cypress-real-events';
import { mount } from 'cypress/react';
import { createTemplatesSettingsTree } from './mountTemplatesSettings.js';

const selectRowCheckbox = (label: string) => {
  cy.contains('[data-testid="settings-templates"] tbody tr', label)
    .find('input[type="checkbox"]')
    .realClick();
};

describe('Settings Templates section services', () => {
  describe('list', () => {
    let templates: ReturnType<typeof createTemplatesSettingsTree>['templates'];
    let router: DataRouter;

    beforeEach(() => {
      const mounted = createTemplatesSettingsTree('/settings/templates');
      templates = mounted.templates;
      router = mounted.router;
      mount(mounted.tree);
    });

    it('loads templates through the list loader', () => {
      cy.get('[data-testid="settings-templates"]').should('be.visible');
      cy.contains('Document').should('be.visible');
      cy.contains('Case').should('be.visible');
      cy.contains('Person').should('be.visible');
    });

    it('disables deletion for default and synced / in-use templates', () => {
      cy.contains('[data-testid="settings-templates"] tbody tr', 'Document')
        .find('input[type="checkbox"]')
        .should('be.disabled');
      cy.contains('[data-testid="settings-templates"] tbody tr', 'Person')
        .find('input[type="checkbox"]')
        .should('be.disabled');
    });

    it('deletes a deletable template from the list', () => {
      selectRowCheckbox('Case');
      cy.get('[data-testid="settings-content-footer"]').should('contain', 'Selected');
      cy.get('[data-testid="settings-content-footer"]').contains('button', 'Delete').realClick();
      cy.get('[data-testid="accept-button"]').click();
      cy.get('[data-testid="modal"]').should('not.exist');

      cy.wrap(router.revalidate());
      cy.get('[data-testid="settings-templates"] tbody').should('not.contain', 'Case');
      cy.wrap(null).then(() => {
        expect(
          templates
            .snapshot()
            .map(item => item._id)
            .sort()
        ).to.deep.equal(['template1', 'template3']);
      });
    });

    it('sets a template as default', () => {
      cy.contains('[data-testid="settings-templates"] tbody tr', 'Case')
        .contains('button', 'Set as default')
        .click({ force: true });

      cy.wrap(router.revalidate());
      cy.wrap(null).then(() => {
        expect(templates.snapshot().find(item => item._id === 'template2')?.default).to.equal(true);
        expect(templates.snapshot().find(item => item._id === 'template1')?.default).to.equal(
          false
        );
      });
    });
  });
});
