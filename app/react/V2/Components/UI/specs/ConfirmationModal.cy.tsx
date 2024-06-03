import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/ConfirmationModal.stories';

const { BasicConfirmation, TextConfirmation, WarningConfirmation, PasswordConfirm } =
  composeStories(stories);

describe('Confirmation modals', () => {
  it('should be accessible', () => {
    cy.injectAxe();

    mount(<BasicConfirmation />);
    cy.checkA11y();

    mount(<TextConfirmation />);
    cy.checkA11y();

    mount(<WarningConfirmation />);
    cy.checkA11y();

    mount(<PasswordConfirm />);
    cy.checkA11y();
  });

  it('should show a simple confirmation', () => {
    mount(<BasicConfirmation />);
    cy.contains('Delete Confirmation').should('be.visible');
    cy.contains('Are you sure you want to delete this product?').should('be.visible');
    cy.contains('Please type').should('not.exist');
  });

  it('should execute actions', () => {
    const onAcceptClick = cy.stub().as('accept');
    const onCancelClick = cy.stub().as('cancel');
    mount(<BasicConfirmation onAcceptClick={onAcceptClick} onCancelClick={onCancelClick} />);
    cy.contains('Accept').click();
    cy.get('@accept').should('have.been.called');
    cy.contains('Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });

  describe('Text confirmation', () => {
    it('should check confirmation text to accept action', () => {
      mount(<TextConfirmation />);
      cy.contains('Delete Confirmation').should('be.visible');
      cy.contains('Are you sure you want to delete this product?').should('be.visible');
      cy.contains('Please type in CONFIRMATION_TEXT:').should('be.visible');
      cy.contains('Yes').should('be.disabled');
      cy.get('[data-testid="confirm-input"]').type('CONFIRMATION_');
      cy.contains('Yes').should('be.disabled');
      cy.get('[data-testid="confirm-input"]').type('TEXT');
      cy.contains('Yes').should('not.be.disabled');
    });

    it('should show a warning', () => {
      mount(<WarningConfirmation />);
      cy.contains('Are you sure').should('be.visible');
      cy.contains('Other users will be affected by this action').should('be.visible');
    });
  });

  describe('Password confirmation', () => {
    it('should enable save button when input has value', () => {
      mount(<PasswordConfirm />);
      cy.contains('Enter your current password to confirm');
      cy.contains('button', 'Accept').should('be.disabled');
      cy.get('input').type('value');
      cy.contains('button', 'Accept').should('be.enabled');
      cy.get('input').clear();
      cy.contains('button', 'Accept').should('be.disabled');
    });

    it('should execute actions', () => {
      const onAcceptClick = cy.stub().as('accept');
      const onCancelClick = cy.stub().as('cancel');
      mount(<PasswordConfirm onAcceptClick={onAcceptClick} onCancelClick={onCancelClick} />);
      cy.get('input').type('currentPassword');
      cy.contains('Accept').click();
      cy.get('@accept').should('have.been.calledOnceWith', 'currentPassword');
      cy.contains('Cancel').click();
      cy.get('@cancel').should('have.been.called');
    });
  });
});
