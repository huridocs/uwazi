import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { Entity } from '#V2/Routes/Entity/Entity.js';
import { TestAtomStoreProvider, TestRouterContext } from '#V2/testing/index.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { logA11yViolations } from '../../../../../../../cypress/support/helpers/a11y.js';

describe('Files tab', () => {
  const sampleEntity: any = {
    _id: 'ent1',
    sharedId: 'shared1',
    title: 'Sample Entity',
    template: 'template1',
    documents: [{ filename: 'file.pdf', _id: '1', language: 'en' }],
    attachments: [{ filename: 'song.mp3', _id: '2', mimetype: 'audio/mpeg' }],
    metadata: {},
  };

  const sampleTemplate = [
    { _id: 'template1', name: 'Template 1', properties: [], commonProperties: [] },
  ];

  const mountEntity = () =>
    mount(
      <TestRouterContext
        loaderData={{
          entity: sampleEntity,
          mainDocument: sampleEntity.documents[0],
          pagePlaintext: '',
        }}
      >
        <TestAtomStoreProvider initialValues={[[templatesAtom, sampleTemplate]]}>
          <Entity />
        </TestAtomStoreProvider>
      </TestRouterContext>
    );

  it('should be accessible', () => {
    mountEntity();
    cy.contains('Files').click();
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, logA11yViolations);
  });

  it('should render table sections and side panel tabs', () => {
    mountEntity();
    cy.contains('Files').click();
    cy.contains('PRIMARY DOCUMENTS').should('exist');
    cy.contains('SUPPORTING FILES').should('exist');
    cy.contains('File').should('exist');
    cy.contains('Translations').should('exist');
  });
});
