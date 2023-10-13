/* eslint-disable max-statements */
import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/dragAndDrop/DragAndDrop.stories';

const { Basic, WithItemComponent, Nested } = composeStories(stories);

describe('DragAndDrop', () => {
  it('should be accessible', () => {
    cy.checkAccesibility([<Basic />, <WithItemComponent />, <Nested />]);
  });

  const shouldContainListItems = (selector: string, items: string[]) => {
    cy.get(selector)
      .eq(0)
      .within(() => {
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
    it('should sort the active items from top to down', () => {
      cy.get('[data-testid="root-draggable-item-0"]').drag(
        '[data-testid="root-draggable-item-2"]',
        { target: { x: 100, y: 20 } }
      );
      shouldContainListItems('[data-testid="active-bin"]', ['Item 2', 'Item 3', 'Item 1']);
      shouldContainListItems('[data-testid="available-bin"]', ['Item 4', 'Item 5']);
      shouldContainListItems('div[data-testid="state-bin"]', ['Item 2', 'Item 3', 'Item 1']);
    });

    it('should sort the active items from down to top', () => {
      cy.get('[data-testid="root-draggable-item-1"]').drag(
        '[data-testid="root-draggable-item-0"]',
        { target: { x: 100, y: 1 } }
      );
      shouldContainListItems('[data-testid="active-bin"]', ['Item 2', 'Item 1', 'Item 3']);
      shouldContainListItems('div[data-testid="state-bin"]', ['Item 2', 'Item 1', 'Item 3']);
    });
  });

  describe('Item Component', () => {
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

  describe('Nested Component', () => {
    beforeEach(() => {
      mount(<Nested />);
    });

    it('should list nested items', () => {
      shouldContainListItems('div[data-testid="active-bin"]', [
        'Item 1\nSubitem 1\nDRAG ITEMS HERE',
        'Subitem 1',
        'Item 2\nDRAG ITEMS HERE',
        'Item 3\nDRAG ITEMS HERE',
      ]);
    });
    it('should add an Item as a parent', () => {
      cy.get('[data-testid="available-draggable-item-0"]').drag('div[data-testid="root"]');
      shouldContainListItems('div[data-testid="active-bin"]', [
        'Item 1\nSubitem 1\nDRAG ITEMS HERE',
        'Subitem 1',
        'Item 2\nDRAG ITEMS HERE',
        'Item 3\nDRAG ITEMS HERE',
        'Item 4\nDRAG ITEMS HERE',
      ]);
    });

    it('should add an Item as a child', () => {
      cy.get('[data-testid="available-draggable-item-0"]').drag('div[data-testid="group_Item 1"]');
      shouldContainListItems('div[data-testid="active-bin"]', [
        'Item 1\nSubitem 1\nItem 4\nDRAG ITEMS HERE',
        'Subitem 1',
        'Item 4',
        'Item 2\nDRAG ITEMS HERE',
        'Item 3\nDRAG ITEMS HERE',
      ]);
    });

    it('should move an item from a parent to another parent', () => {
      cy.get('[data-testid="group_Item 1-draggable-item-0"]').drag(
        'div[data-testid="group_Item 2"]'
      );
      shouldContainListItems('div[data-testid="active-bin"]', [
        'Item 1\nDRAG ITEMS HERE',
        'Item 2\nSubitem 1\nDRAG ITEMS HERE',
        'Subitem 1',
        'Item 3\nDRAG ITEMS HERE',
      ]);
    });

    it('should move an child item to the root level', () => {
      cy.get('[data-testid="group_Item 1-draggable-item-0"]').drag('div[data-testid="root"]');
      shouldContainListItems('div[data-testid="active-bin"]', [
        'Item 1\nDRAG ITEMS HERE',
        'Item 2\nDRAG ITEMS HERE',
        'Item 3\nDRAG ITEMS HERE',
        'Subitem 1\nDRAG ITEMS HERE',
      ]);
    });

    it('should remove a parent', () => {
      cy.get('[data-testid="root-draggable-item-0"]').within(() => {
        cy.get('button').eq(0).click();
      });
      shouldContainListItems('div[data-testid="active-bin"]', [
        'Item 2\nDRAG ITEMS HERE',
        'Item 3\nDRAG ITEMS HERE',
      ]);
    });

    it('should remove a child', () => {
      cy.get('[data-testid="group_Item 1-draggable-item-0"]').within(() => {
        cy.get('button').eq(0).click();
      });
      shouldContainListItems('div[data-testid="active-bin"]', [
        'Item 1\nDRAG ITEMS HERE',
        'Item 2\nDRAG ITEMS HERE',
        'Item 3\nDRAG ITEMS HERE',
      ]);
    });

    it('should sort parents', () => {
      cy.get('[data-testid="root-draggable-item-0"]').drag(
        '[data-testid="root-draggable-item-2"]',
        { target: { x: 1, y: 100 } }
      );
      shouldContainListItems('div[data-testid="active-bin"]', [
        'Item 2\nDRAG ITEMS HERE',
        'Item 3\nDRAG ITEMS HERE',
        'Item 1\nSubitem 1\nDRAG ITEMS HERE',
        'Subitem 1',
      ]);
    });

    it('should sort children of a parent', () => {
      cy.get('[data-testid="available-draggable-item-1"]').drag('[data-testid="group_Item 1"]');
      cy.get('[data-testid="group_Item 1-draggable-item-0"]').drag(
        '[data-testid="group_Item 1-draggable-item-1"]',
        {
          target: { x: 100, y: 20 },
        }
      );
      cy.get('[data-testid="root-draggable-item-2"]').drag('div[data-testid="group_Item 1"]', {
        target: { x: 100, y: 15 },
      });
      cy.get('[data-testid="available-draggable-item-0"]').drag(
        '[data-testid="group_Item 1"]>span',
        {
          target: { x: 100, y: 15 },
        }
      );
      cy.get('[data-testid="group_Item 1-draggable-item-3"]').drag(
        '[data-testid="group_Item 1-draggable-item-1"]'
      );
      cy.get('[data-testid="group_Item 1-draggable-item-2"]').drag(
        '[data-testid="group_Item 1-draggable-item-3"]',
        {
          target: { x: 100, y: 20 },
        }
      );
      shouldContainListItems('div[data-testid="active-bin"]', [
        'Item 1\nItem 5\nItem 4\nItem 3\nSubitem 1\nDRAG ITEMS HERE',
        'Item 5',
        'Item 4',
        'Item 3',
        'Subitem 1',
        'Item 2\nDRAG ITEMS HERE',
      ]);
    });

    it('should not change list when unallowed dragging', () => {
      cy.get('[data-testid="root-draggable-item-0"]').drag('[data-testid="group_Item 1"]>span', {
        target: { x: 100, y: 15 },
      });
      cy.get('[data-testid="group_Item 1-draggable-item-0"]').drag(
        '[data-testid="group_Item 1"]>span',
        {
          target: { x: 100, y: 15 },
        }
      );
      cy.get('[data-testid="root-draggable-item-1"]').drag('div[data-testid="root"]');
      shouldContainListItems('div[data-testid="active-bin"]', [
        'Item 1\nSubitem 1\nDRAG ITEMS HERE',
        'Subitem 1',
        'Item 2\nDRAG ITEMS HERE',
        'Item 3\nDRAG ITEMS HERE',
      ]);
    });
  });
});
