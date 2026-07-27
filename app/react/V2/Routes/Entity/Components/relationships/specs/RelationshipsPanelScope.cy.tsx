import React from 'react';
import { mount } from 'cypress/react';
import type { Entity } from '#V2/api/entities/types.js';
import { apiEntity } from '#app/stories/fixtures/referencesFixtures.js';
import { RelationshipsStoryShell } from '#app/stories/EntityViewer/relationshipsStoryShell.js';
import {
  expandAllRelationships,
  prepareRelationshipsViewport,
  suppressResizeObserverLoop,
} from '#V2/Components/Relationships/specs/relationshipsCyHelpers.js';

const cloneStoryEntity = (sharedId: string): Entity => ({
  ...apiEntity,
  sharedId,
  relations: apiEntity.relations?.map(relation =>
    relation.entity === apiEntity.sharedId ? { ...relation, entity: sharedId } : relation
  ),
});

describe('Relationships panel across entities', () => {
  before(() => {
    suppressResizeObserverLoop();
  });

  beforeEach(() => {
    prepareRelationshipsViewport();
  });

  it('clears the search filter when viewing a different entity', () => {
    const nextEntity = cloneStoryEntity('entity-scope-reset');

    mount(<RelationshipsStoryShell locale="en" />);
    cy.get('[aria-label="Search relationships"]', { timeout: 20000 }).type('Person');
    cy.get('[aria-label="Search relationships"]').should('have.value', 'Person');

    mount(<RelationshipsStoryShell locale="en" entity={nextEntity} />);
    cy.get('[aria-label="Search relationships"]', { timeout: 20000 }).should('have.value', '');
    expandAllRelationships();
    cy.contains('Person 1').should('be.visible');
  });
});
