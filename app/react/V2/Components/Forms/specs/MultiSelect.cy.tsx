import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Forms/MultiSelect.stories';

const { Basic: MultiSelect } = composeStories(stories);

describe('MultiSelect', () => {
  describe('Rendering', () => {
    beforeEach(() => {
      mount(<MultiSelect />);
    });

    it('should be accessible', () => {
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should render context menu when button clicked', () => {
      cy.get('[data-testid="multiselect"] button').click();
      cy.get('ul li').should('have.length', 19);
    });

    it('should close when clicking on the open button again', () => {
      cy.get('[data-testid="multiselect"] button').click();
      cy.get('[data-testid="multiselect"] button').click();
      cy.get('ul li').should('not.exist');
    });

    it('should close when clicking outside of the component', () => {
      cy.get('[data-testid="multiselect"] button').click();
      cy.contains('h1', 'Multiselect component').click();
      cy.get('ul li').should('not.exist');
    });
  });

  describe('Main area', () => {
    beforeEach(() => {
      mount(<MultiSelect />);
      cy.get('[data-testid="multiselect"] button').click();
      cy.get('ul li').get('input').eq(1).click();
      cy.get('ul li').get('input').eq(2).click();
    });

    it('should display selected options in the main area', () => {
      cy.get('[data-testid="pill-comp"]').should('have.length', 2);
    });

    it('should remove an option when unchecked', () => {
      cy.get('[data-testid="pill-comp"]')
        .eq(0)
        .within(() => {
          cy.get('button').click();
        });
      cy.get('[data-testid="pill-comp"]').should('have.length', 1);
    });
  });

  describe('onChange', () => {
    it('should execute the onchange action when adding or removing items and return the updated options', () => {
      const onChangeSpy = cy.stub().as('onChange');
      mount(
        <MultiSelect
          onChange={value => {
            onChangeSpy(value);
          }}
        />
      );
      cy.get('[data-testid="multiselect"] button').click();
      cy.get('ul li').get('input').eq(1).click();

      cy.get('@onChange').should('have.been.calledOnceWith', ['another']);
    });
  });

  describe('disabled', () => {
    it('should not be able to open the popover menu or remove items', () => {
      mount(
        <MultiSelect
          disabled
          options={[
            { label: 'Value 1', value: 'someone' },
            { label: 'Value 2', value: 'another' },
          ]}
          value={['someone', 'another']}
        />
      );

      cy.get('[data-testid="multiselect"] button').eq(0).should('be.disabled');
      cy.get('[data-testid="multiselect"] button').eq(1).should('be.disabled');
    });
  });
});
