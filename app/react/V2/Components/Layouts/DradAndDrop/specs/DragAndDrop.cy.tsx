import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/dragAndDrop/DragAndDrop.stories';

const { Basic, WithItemComponent, Nested } = composeStories(stories);

describe('DragAndDrop', () => {
  it('should be accessible', () => {
    cy.injectAxe();

    mount(<Basic />);
    cy.checkA11y();

    mount(<WithItemComponent />);
    cy.checkA11y();

    mount(<Nested />);
    cy.checkA11y();
  });

  const shouldContainListItems = (selector: string, items: string[]) => {
    cy.get(selector).within(() => {
      cy.get('ul > li')
        .should('have.length', items.length)
        .then($els => Cypress.$.makeArray($els).map(el => el.innerText))
        .should('deep.equal', items);
    });
  };

  const dragItem = (name: string, target: string = 'Drag items here') => {
    cy.contains(name).trigger('dragstart');
    cy.contains(name).trigger('dragleave');
    cy.contains(target).trigger('drop');
    cy.contains(target).trigger('dragend');
  };
  describe('Basic', () => {
    beforeEach(() => {
      mount(<Basic />);
    });

    it('should list the active items', () => {
      shouldContainListItems('div[data-testid="active-bin"]', ['Item 1', 'Item 2', 'Item 3']);
      shouldContainListItems('div[data-testid="available-bin"]', ['Item 4', 'Item 5']);
      shouldContainListItems('div[data-testid="state-bin"]', ['Item 1', 'Item 2', 'Item 3']);
    });

    it('should drag and drop a new item', () => {
      dragItem('Item 4');
      shouldContainListItems('div[data-testid="active-bin"]', [
        'Item 1',
        'Item 2',
        'Item 3',
        'Item 4',
      ]);
      shouldContainListItems('div[data-testid="available-bin"]', ['Item 5']);
      shouldContainListItems('div[data-testid="state-bin"]', [
        'Item 1',
        'Item 2',
        'Item 3',
        'Item 4',
      ]);
    });
    const swapItems = (source: string, target: string, position: string = 'bottom') => {
      cy.get('div[data-testid="active_filters_root"]').within(() => {
        //@ts-ignore
        cy.get(source).drag(target, {
          waitForAnimations: true,
          target: { position },
          force: true,
        });
      });
    };
    it('should sort the active items from top to down', () => {
      swapItems('[data-testid="draggable-item-0"]', '[data-testid="draggable-item-2"]');
      shouldContainListItems('[data-testid="active-bin"]', ['Item 2', 'Item 3', 'Item 1']);
      shouldContainListItems('[data-testid="available-bin"]', ['Item 4', 'Item 5']);
      shouldContainListItems('div[data-testid="state-bin"]', ['Item 2', 'Item 3', 'Item 1']);
    });

    it('should sort the active items from down to top', () => {
      swapItems('[data-testid="draggable-item-1"]', '[data-testid="draggable-item-0"]', 'top');
      shouldContainListItems('[data-testid="active-bin"]', ['Item 2', 'Item 1', 'Item 3']);
      shouldContainListItems('div[data-testid="state-bin"]', ['Item 2', 'Item 1', 'Item 3']);
    });
  });

  describe('WithItemComponent', () => {
    beforeEach(() => {
      mount(<WithItemComponent />);
    });

    it('should remove an active item', () => {
      cy.contains('Item 2')
        .parent()
        .within(() => {
          cy.get('button').click();
        });
      dragItem('Item 5');
      shouldContainListItems('div[data-testid="active-bin"]', ['Item 1', 'Item 3', 'Item 5']);
      shouldContainListItems('div[data-testid="available-bin"]', ['Item 4', 'Item 2']);
      shouldContainListItems('div[data-testid="state-bin"]', ['Item 1', 'Item 3', 'Item 5']);
    });
  });
});
