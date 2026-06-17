import React from 'react';
import { mount } from 'cypress/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { RelationshipsStoryShell } from '#app/stories/EntityViewer/relationshipsStoryShell.js';
import {
  RelationshipsPanel,
  RelationshipsFiltersDrawer,
} from '#V2/Routes/Entity/Components/relationships/index.js';
import {
  useRelationshipsActions,
  type ReferenceMode,
} from '#V2/Routes/Entity/Components/context/index.js';

const selection: TextSelection = {
  text: 'Selected text',
  selectionRectangles: [{ top: 0, left: 0, width: 10, height: 10, regionId: '1' }],
};

const CreateReferenceTrigger = ({ mode }: { mode: ReferenceMode }) => {
  const { setCreateReferenceSelection } = useRelationshipsActions();
  return (
    <button type="button" onClick={() => setCreateReferenceSelection(selection, mode)}>
      Open create reference
    </button>
  );
};

const mountRelationshipsPanel = (mode: ReferenceMode) =>
  mount(
    <RelationshipsStoryShell locale="en">
      <>
        <CreateReferenceTrigger mode={mode} />
        <RelationshipsPanel />
        <RelationshipsFiltersDrawer />
      </>
    </RelationshipsStoryShell>
  );

describe('Relationships context', () => {
  it('opens the create-reference flow for a text selection', () => {
    mountRelationshipsPanel('text');

    cy.contains('button', 'Open create reference').click();
    cy.contains('Relationship type').should('be.visible');
    cy.contains('button', 'Cancel').should('be.visible');
    cy.contains('button', 'Save').should('be.visible');
    cy.contains('Person 1').should('not.exist');
  });

  it('opens entity search when create-reference mode is entity', () => {
    mountRelationshipsPanel('entity');

    cy.contains('button', 'Open create reference').click();
    cy.get('#entity-search').should('be.visible');
  });

  it('returns to the relationship list when create-reference is cancelled', () => {
    mountRelationshipsPanel('text');

    cy.contains('Person 1').should('be.visible');
    cy.contains('button', 'Open create reference').click();
    cy.contains('button', 'Cancel').click();
    cy.contains('Person 1').should('be.visible');
    cy.contains('button', 'Save').should('not.exist');
  });
});
