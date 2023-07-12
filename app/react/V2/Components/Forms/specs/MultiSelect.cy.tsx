import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import { sortBy } from 'lodash';
import * as stories from 'app/stories/Forms/MultiSelect.stories';

const { Basic: MultiSelect } = composeStories(stories);

const expectedArguments = sortBy(
  [
    { label: 'Someone', value: 'someone' },
    { label: 'Another', value: 'another', selected: true },
    { label: 'Another name', value: 'another name' },
    { label: 'And another', value: 'and another' },
    { label: 'Item A', value: 'item1' },
    { label: 'Item B', value: 'item2' },
    { label: 'Item C', value: 'item3' },
    { label: 'Item F', value: 'item4' },
    { label: 'Item G', value: 'item5' },
    { label: 'Item E', value: 'item6' },
    { label: 'Item I', value: 'item7' },
    { label: 'Item J', value: 'item8' },
    { label: 'Item H', value: 'item9' },
    { label: 'Item with extra extra extra long name 1', value: 'lItem1' },
    { label: 'Item with extra extra extra long name 2', value: 'lItem2' },
    { label: 'Item with extra extra extra long name 3', value: 'lItem3' },
    { label: 'Item with extra extra extra long name 4', value: 'lItem4' },
    { label: 'Item with extra extra extra long name 5', value: 'lItem5' },
    { label: 'Item with extra extra extra extra extraextraextra long name', value: 'xlItem' },
  ],
  'label'
);

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

    it('should sort the option by label', () => {
      cy.get('[data-testid="multiselect"] button').click();
      cy.get('ul').within(() => {
        cy.get('li').eq(0).contains('label', 'And another');
        cy.get('li').eq(1).contains('label', 'Another');
        cy.get('li').eq(18).contains('label', 'Someone');
      });
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
          onChange={options => {
            onChangeSpy(options);
          }}
        />
      );
      cy.get('[data-testid="multiselect"] button').click();
      cy.get('ul li').get('input').eq(1).click();

      cy.get('@onChange').should('have.been.calledOnceWith', expectedArguments);
    });
  });

  describe('disabled', () => {
    it('should not be able to open the popover menu or remove items', () => {
      mount(
        <MultiSelect
          disabled
          options={[
            { label: 'Value 1', value: 'someone', selected: true },
            { label: 'Value 2', value: 'another', selected: true },
          ]}
        />
      );

      cy.get('[data-testid="multiselect"] button').eq(0).should('be.disabled');
      cy.get('[data-testid="multiselect"] button').eq(1).should('be.disabled');
    });
  });
});
