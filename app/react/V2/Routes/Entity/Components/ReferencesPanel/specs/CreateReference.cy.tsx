import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/CreateReference.stories';
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

  it('should render in text mode', () => {
    mount(<TextMode />);
    cy.contains('button', 'Cancel').should('be.visible');
    cy.contains('button', 'Save').should('be.visible');
  });
});
