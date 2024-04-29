import React from 'react';
import 'cypress-axe';
import { Provider } from 'react-redux';
import { mount } from '@cypress/react18';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { MultiselectList } from '../MultiselectList';

describe('MultiselectList.cy.tsx', () => {
  const pizzas = [
    { label: 'Margherita', value: 'MGT', searchLabel: 'Margherita' },
    { label: 'Pepperoni', value: 'PPR', searchLabel: 'Pepperoni' },
    { label: 'Hawaiian', value: 'HWN', searchLabel: 'Hawaiian' },
    { label: 'Vegetarian', value: 'VGT', searchLabel: 'Vegetarian' },
    { label: 'Meat Lovers', value: 'MLV', searchLabel: 'Meat Lovers' },
    { label: 'BBQ Chicken', value: 'BQC', searchLabel: 'BBQ Chicken' },
    { label: 'Mushroom', value: 'MSH', searchLabel: 'Mushroom' },
    { label: 'Four Cheese', value: 'FC', searchLabel: 'Four Cheese' },
    { label: 'Buffalo Chicken', value: 'BFC', searchLabel: 'Buffalo Chicken' },
    { label: 'Chicken Bacon Ranch', value: 'CBR', searchLabel: 'Chicken Bacon Ranch' },
    { label: 'Chicken Alfredo', value: 'CAF', searchLabel: 'Chicken Alfredo' },
  ];
  let selected: string[] = [];

  beforeEach(() => {
    cy.viewport(450, 650);
    mount(
      <Provider store={createStore()}>
        <div className="p-2 tw-content">
          <MultiselectList
            items={pizzas}
            onChange={selectedItems => {
              selected = selectedItems;
            }}
          />
        </div>
      </Provider>
    );
  });

  it('should be accessible', () => {
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should render the list of options', () => {
    pizzas.forEach(({ label }) => {
      cy.contains(label).should('be.visible');
    });
  });

  it('should filter the list of options', () => {
    cy.get('input[type=text]').type('chicken');
    cy.contains('BBQ Chicken').should('be.visible');
    cy.contains('Buffalo Chicken').should('be.visible');
    cy.contains('Chicken Bacon Ranch').should('be.visible');
    cy.contains('Chicken Alfredo').should('be.visible');
    cy.contains('Margherita').should('not.exist');
  });

  it('should select options', () => {
    cy.get('input[type=text]').type('chicken');
    cy.contains('BBQ Chicken').click();

    cy.get('[data-testid="clear-field-button"]').click();
    cy.get('input[type=text]').type('margherita');
    cy.contains('Margherita').click();

    cy.get('[data-testid="clear-field-button"]').click();
    cy.contains('span', 'BBQ Chicken').siblings().contains('Selected');
    cy.contains('span', 'Margherita').siblings().contains('Selected');
    cy.get('ul').then(() => {
      expect(selected).to.deep.equal(['BQC', 'MGT']);
    });
  });

  it('should show all the options with their status', () => {
    const items: string[] = [];
    cy.get('input[type="radio"]:checked').siblings().contains('All');
    cy.get('input[type="radio"]').eq(1).should('be.disabled');
    cy.get('[data-testid="pill-comp"]').eq(3).click();
    cy.get('[data-testid="pill-comp"]').eq(6).click();
    cy.get('li:visible').each($li => items.push($li.text()));
    cy.wrap(items).should('deep.equal', [
      'MargheritaSelect',
      'PepperoniSelect',
      'HawaiianSelect',
      'VegetarianSelected',
      'Meat LoversSelect',
      'BBQ ChickenSelect',
      'MushroomSelected',
      'Four CheeseSelect',
      'Buffalo ChickenSelect',
      'Chicken Bacon RanchSelect',
      'Chicken AlfredoSelect',
    ]);
  });

  it('should show only the selected options', () => {
    const selectedItems: string[] = [];
    cy.get('[data-testid="pill-comp"]').eq(3).click();
    cy.get('[data-testid="pill-comp"]').eq(6).click();

    cy.get('input[type="radio"]').eq(1).click();
    cy.get('li:visible').each($li => selectedItems.push($li.text()));
    cy.wrap(selectedItems).should('deep.equal', ['VegetarianSelected', 'MushroomSelected']);
  });
});
