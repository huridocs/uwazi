import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/CreateReference.stories';
import { CreateReference } from 'V2/Routes/Entity/Components/ReferencesPanel/CreateReference';
import { logA11yViolations } from '../../../../../../../../cypress/support/helpers/a11y.js';

const { Default, EmptyRelationshipTypes, LongSelection, TextMode } = composeStories(stories);

describe('CreateReference', () => {
  it('should be accessible', () => {
    mount(<Default />);
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, logA11yViolations);
  });

  it('should render initial state with Cancel and Save buttons', () => {
    mount(<Default />);
    cy.contains('button', 'Cancel').should('be.visible');
    cy.contains('button', 'Save').should('be.visible');
  });

  it('should call onCancel when Cancel is clicked', () => {
    const onCancel = cy.stub().as('onCancel');
    mount(<Default onCancel={onCancel} />);
    cy.contains('button', 'Cancel').click();
    cy.get('@onCancel').should('have.been.calledOnce');
  });

  it('should render when there are no relationship types', () => {
    mount(<EmptyRelationshipTypes />);
    cy.contains('button', 'Cancel').should('be.visible');
  });

  it('should render with long selection (panel loads)', () => {
    mount(<LongSelection />);
    cy.contains('button', 'Cancel').should('be.visible');
    cy.contains('button', 'Save').should('be.visible');
  });

  it('should call onSave when in entity mode', () => {
    const onSave = cy.stub().as('onSave');
    const mockEntities = [
      {
        _id: 'entity-1',
        sharedId: 'shared-entity-1',
        title: 'Simple entity',
        template: { _id: 'template-1', name: 'Template', label: 'Template', color: '#A4CAFE' },
        metadata: [],
      },
    ] as any[];

    const searchFunction = cy
      .stub()
      .as('searchFunction')
      .callsFake(() => Promise.resolve(mockEntities));

    const selection = {
      text: 'Selected text',
      selectionRectangles: [{ top: 0, left: 0, width: 10, height: 10, regionId: '1' }],
    } as any;

    const relationshipTypes = [{ _id: 'rel-1', name: 'Related to' }] as any[];

    mount(
      <div className="tw-content" style={{ width: '400px', height: '900px' }}>
        <CreateReference
          selection={selection}
          relationshipTypes={relationshipTypes}
          searchFunction={searchFunction}
          mode="entity"
          onSave={onSave}
        />
      </div>
    );

    cy.get('#entity-search').type('Simple');

    cy.get('@searchFunction').should('have.been.called');
    cy.contains('Simple entity').click();
    cy.contains('Related to').click();

    cy.contains('button', 'Save').click();

    cy.get('@onSave').should('have.been.calledOnce');
    cy.get('@onSave')
      .its('firstCall.args.0')
      .should('include', {
        targetEntityId: 'shared-entity-1',
        relationshipType: 'rel-1',
      });
  });

  it('should render in text mode', () => {
    mount(<TextMode />);
    cy.contains('button', 'Cancel').should('be.visible');
    cy.contains('button', 'Save').should('be.visible');
  });
});
