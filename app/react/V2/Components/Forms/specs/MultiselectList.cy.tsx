/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Forms/MultiselectList.stories';
import {
  MultiselectList,
  MultiselectListOption,
  defaultSearch,
} from '../MultiselectList/MultiselectList';
import { specialCharacters, pizzas, salads } from './fixtures';

const BasicTestComponent = () => {
  const [items, setItems] = useState(pizzas);

  return (
    <div className="p-2 tw-content">
      <MultiselectList
        items={items}
        onSearch={term => {
          setItems(prev => defaultSearch(term, prev));
        }}
      />
    </div>
  );
};

const ItemUpdateComponent = ({ initialItems }: { initialItems: MultiselectListOption[] }) => {
  const [items, setItems] = useState(initialItems);

  return (
    <div className="p-2 tw-content">
      <MultiselectList items={items} />
      <button
        type="button"
        onClick={() => {
          setItems([
            {
              label: 'Updated Item 1',
              searchLabel: 'Updated Item 1',
              value: 'item3',
            },
            {
              label: 'Updated Item 2',
              searchLabel: 'Updated Item 2',
              value: 'item4',
            },
          ]);
        }}
      >
        Update Items
      </button>
    </div>
  );
};

describe('MultiselectList.cy.tsx', { viewportWidth: 450, viewportHeight: 650 }, () => {
  describe('general', () => {
    beforeEach(() => {
      mount(<BasicTestComponent />);
    });

    it('should be accessible', () => {
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should render the list of options', () => {
      pizzas.forEach(({ label }) => {
        cy.contains(label as string).should('be.visible');
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
  });

  describe('selections', () => {
    let selected: string[] = [];

    beforeEach(() => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList
            items={pizzas}
            onChange={selectedItems => {
              selected = selectedItems;
            }}
          />
        </div>
      );
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

    it('should show only the selected options', () => {
      const selectedItems: string[] = [];
      cy.get('[data-testid="pill-comp"]').eq(3).click();
      cy.get('[data-testid="pill-comp"]').eq(6).click();

      cy.get('input[type="radio"]').eq(1).click();
      cy.get('li:visible').each($li => selectedItems.push($li.text()));
      cy.wrap(selectedItems).should('deep.equal', ['VegetarianSelected', 'MushroomSelected']);
    });

    it('should allow selecting all items', () => {
      const selections: string[] = [];

      mount(
        <div className="p-2 tw-content">
          <MultiselectList
            items={pizzas}
            onChange={selectedItems => {
              selections.push(...selectedItems);
            }}
            allowSelelectAll
          />
        </div>
      );

      cy.contains('button', 'Select all').click();
      cy.wrap(selections).should('deep.equal', [
        'MGT',
        'PPR',
        'HWN',
        'VGT',
        'MLV',
        'BQC',
        'MSH',
        'FC',
        'BFC',
        'CBR',
        'CAF',
      ]);
    });

    it('should allow selecting all items within groups', () => {
      const selections: string[] = [];

      mount(
        <div className="p-2 tw-content">
          <MultiselectList
            items={salads}
            onChange={selectedItems => {
              selections.push(...selectedItems);
            }}
            allowSelelectAll
          />
        </div>
      );

      cy.contains('button', 'Select all').click();
      cy.wrap(selections).should('deep.equal', [
        'veggy_caesar',
        'veggy_medit',
        'tai',
        'vegan_caesar',
        'vegan_medit',
        'rice',
        'caesar',
        'medit',
        'super',
      ]);
    });
  });

  describe('blank state property', () => {
    it('should show blank state property if there is no items passed to the component', () => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList onChange={() => {}} items={[]} />
        </div>
      );
      cy.contains('No items available').should('be.visible');
    });

    it('should accept a blank state string', () => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList onChange={() => {}} items={[]} noItems="nada" />
        </div>
      );
      cy.contains('nada').should('be.visible');
    });

    it('should accept a blank state component', () => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList onChange={() => {}} items={[]} noItems={<div>no items string</div>} />
        </div>
      );
      cy.contains('no items string').should('be.visible');
    });
  });

  describe('hide filters property', () => {
    it('should load/show filters when hideFilters is not set', () => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList onChange={() => {}} items={[]} />
        </div>
      );
      cy.get('[data-testid="multiselectlist-filters"]').should('exist');
    });

    it('should not load/show filters when hideFilters is true', () => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList onChange={() => {}} items={[]} hideFilters />
        </div>
      );
      cy.get('[data-testid="multiselectlist-filters"]').should('not.exist');
    });
  });

  describe('custom class name properties', () => {
    it('should apply a custom class name to each item', () => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList
            onChange={() => {}}
            items={[
              {
                label: 'Item 1',
                searchLabel: 'Item 1',
                value: 'item1',
              },
              {
                label: 'Item 2',
                searchLabel: 'Item 2',
                value: 'item2',
              },
            ]}
            itemClassName="bg-red-50"
          />
        </div>
      );
      cy.get('li').should('have.class', 'bg-red-50');
    });

    it('should apply the default class name to each item if no custom class name is provided', () => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList
            onChange={() => {}}
            items={[
              {
                label: 'Item 1',
                searchLabel: 'Item 1',
                value: 'item1',
              },
              {
                label: 'Item 2',
                searchLabel: 'Item 2',
                value: 'item2',
              },
            ]}
          />
        </div>
      );
      cy.get('li').should('have.class', 'bg-gray-50');
    });

    it('should apply a custom class name to each checkbox item', () => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList
            onChange={() => {}}
            items={[
              {
                label: 'Item 1',
                searchLabel: 'Item 1',
                value: 'item1',
              },
              {
                label: 'Item 2',
                searchLabel: 'Item 2',
                value: 'item2',
              },
            ]}
            checkboxes
            itemClassName="bg-gray-50"
          />
        </div>
      );
      cy.get('li').should('have.class', 'bg-gray-50');
    });

    it('should apply the default class name to each checkbox item if no custom class name is provided', () => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList
            onChange={() => {}}
            items={[
              {
                label: 'Item 1',
                searchLabel: 'Item 1',
                value: 'item1',
              },
              {
                label: 'Item 2',
                searchLabel: 'Item 2',
                value: 'item2',
              },
            ]}
            checkboxes
          />
        </div>
      );
      cy.get('li').should('have.class', 'mb-2');
    });

    it('should apply a custom class name to the items container', () => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList
            onChange={() => {}}
            items={[]}
            itemContainerClassName="custom-container-class"
          />
        </div>
      );
      cy.get('ul').should('have.class', 'custom-container-class');
    });

    it('should apply the default class name to the items container if no custom class name for the container is provided', () => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList onChange={() => {}} items={[]} />
        </div>
      );
      cy.get('ul').should('have.class', 'w-full grow px-2 pt-2 overflow-y-auto');
    });
  });

  describe('search function', () => {
    beforeEach(() => {
      mount(
        <div className="p-2 tw-content">
          <MultiselectList items={specialCharacters} />
        </div>
      );
    });

    [
      { searchTerm: 'Aslog', results: ['Åslög'] },
      { searchTerm: 'Hélèna', results: ['Hélèna'] },
      { searchTerm: 'penelope', results: ['Pénélope', 'Penelopee'] },
      { searchTerm: 'Loïca', results: ['Loïca'] },
      { searchTerm: '.com', results: ['oakley.com'] },
      { searchTerm: '琳', results: ['美琳'] },
      { searchTerm: '银含', results: ['银含'] },
      { searchTerm: 'Татьяна', results: ['Татьяна'] },
    ].forEach(({ searchTerm, results }) => {
      it(`should be able to search ${results} by ${searchTerm}`, () => {
        cy.get('input[type=text]').type(searchTerm);
        results.forEach(result => {
          cy.contains('li', result).should('have.length', 1);
        });
      });
    });
  });

  describe('custom search', () => {
    const { RemoteSearch } = composeStories(stories);

    it('should not trigger the search function on mount', () => {
      const searchSpy = cy.spy().as('searchSpy');
      mount(<RemoteSearch onSearch={searchSpy} />);
      cy.clock();
      cy.tick(2000);
      cy.contains('No items available').then(() => {
        cy.get('@searchSpy').should('not.have.been.called');
      });
    });

    it('should search once after the user finishes typing', () => {
      const searchSpy = cy.spy().as('searchSpy');
      mount(<RemoteSearch onSearch={searchSpy} />);
      cy.clock();
      cy.get('input[type=text]').type('Item');
      cy.tick(2000);
      cy.get('@searchSpy').should('have.been.calledOnce');
    });

    it('should search when filling the field via a UI action instead of typing', () => {
      mount(<RemoteSearch />);
      cy.clock();
      cy.contains('button', 'Search & Focus').click();
      cy.tick(2000);
      cy.contains('Another');
    });
  });

  describe('items prop updates', () => {
    it('should update rendered items when items prop changes from parent', () => {
      const initialItems = [
        {
          label: 'Initial Item 1',
          searchLabel: 'Initial Item 1',
          value: 'item1',
        },
        {
          label: 'Initial Item 2',
          searchLabel: 'Initial Item 2',
          value: 'item2',
        },
      ];

      mount(<ItemUpdateComponent initialItems={initialItems} />);

      cy.contains('Initial Item 1').should('be.visible');
      cy.contains('Initial Item 2').should('be.visible');

      cy.contains('button', 'Update Items').click();

      cy.contains('Updated Item 1').should('be.visible');
      cy.contains('Updated Item 2').should('be.visible');

      cy.contains('Initial Item 1').should('not.exist');
      cy.contains('Initial Item 2').should('not.exist');
    });
  });
});
