/* eslint-disable max-statements */
import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import { map } from 'lodash';
import * as stories from 'app/stories/Table.stories';
import { tableWithDisabled } from '../Table/specs/fixtures';

const { Basic, Nested, Custom } = composeStories(stories);

describe('Table', () => {
  const data = Basic.args.tableData || [];
  const dataWithNested = Nested.args.tableData || [];

  const checkRowContent = (rowNumber: number, cellsContent: string[]) => {
    cellsContent.forEach(
      (content, index) =>
        content &&
        cy.get(`tbody > :nth-child(${rowNumber}) > :nth-child(${index + 1})`).contains(content)
    );
  };

  it('should be accessible', () => {
    cy.injectAxe();
    mount(<Basic />);
    cy.checkA11y();
  });

  beforeEach(() => {
    Basic.args.defaultSorting = undefined;
    Basic.args.enableSelections = false;
    Basic.args.dnd = { enable: false, disableEditingGroups: false };
  });

  it('Should return a table with the columns and row specified', () => {
    mount(<Basic />);
    const toStrings = (cells: JQuery<HTMLElement>) => map(cells, 'textContent');
    cy.get('tr th').then(toStrings).should('eql', ['Title', 'Description', 'Date added']);

    checkRowContent(1, ['Entity 2', data[0].description, '2']);
    checkRowContent(2, ['Entity 1', data[1].description, '1']);
    checkRowContent(3, ['Entity 4', data[2].description, '4']);
    checkRowContent(4, ['Entity 3', data[3].description, '3']);
    checkRowContent(5, ['Entity 5', data[4].description, '5']);
  });

  it('should render the data in a custom component and styles', () => {
    mount(<Custom />);
    cy.get('table').within(() => {
      cy.contains('th', 'Description').should(
        'have.attr',
        'class',
        'p-4 text-sm text-gray-500 uppercase border-b bg-blue-700 text-white'
      );
      cy.contains('td', 'Entity 2').should(
        'have.attr',
        'class',
        'relative px-4 py-2 bg-gray-100 text-red-700 '
      );
      cy.contains('td', 'Entity 1').should(
        'have.attr',
        'class',
        'relative px-4 py-2 bg-gray-100 text-red-700 '
      );
      cy.get('div[class="text-white bg-orange-500"]').should('have.length', 5);
      cy.get('button').should('have.length', 5);
    });
  });

  it('should trigger the custom action for the buttons', () => {
    Custom.args.actionFn = cy.spy().as('actionSpy');
    mount(<Custom />);

    cy.contains('tr', 'Entity 1').within(() => {
      cy.contains('button', 'Action').realClick();
    });

    cy.get('@actionSpy').should('have.been.calledOnceWith', 'A1');
  });

  describe('Sorting', () => {
    it('Should be sortable by title', () => {
      mount(<Basic />);

      cy.get('th').contains('Title').realClick();
      cy.contains('button', 'Save changes').realClick();

      checkRowContent(1, ['Entity 1', data[1].description, '1']);
      checkRowContent(2, ['Entity 2', data[0].description, '2']);
      checkRowContent(3, ['Entity 3', data[3].description, '3']);
      checkRowContent(4, ['Entity 4', data[2].description, '4']);
      checkRowContent(5, ['Entity 5', data[4].description, '5']);
    });

    it('should return to the default sorting', () => {
      mount(<Basic />);
      cy.get('th').contains('Title').realClick().realClick().realClick();

      checkRowContent(1, ['Entity 2', data[0].description, '2']);
      checkRowContent(2, ['Entity 1', data[1].description, '1']);
      checkRowContent(3, ['Entity 4', data[2].description, '4']);
      checkRowContent(4, ['Entity 3', data[3].description, '3']);
      checkRowContent(5, ['Entity 5', data[4].description, '5']);
    });

    it('should keep selections when sorting', () => {
      Basic.args.enableSelections = true;
      mount(<Basic />);

      cy.get('tbody').within(() => {
        cy.get('input[type="checkbox"]').eq(0).check();
        cy.get('input[type="checkbox"]').eq(2).check();
      });

      cy.get('th').contains('Title').realClick().realClick();
      cy.contains('button', 'Save changes').realClick();

      cy.get('[data-testid="selected-items"]').within(() => {
        cy.contains('Entity 2');
        cy.contains('Entity 4');
      });
    });

    it('should sort items in groups', () => {
      mount(<Nested />);
      cy.contains('tr', 'Group 1').within(() => {
        cy.contains('button', 'Open group').realClick();
      });

      checkRowContent(1, [
        'Drag row',
        'Select',
        'Group',
        'Group 1',
        dataWithNested[0].description,
        '10',
      ]);
      checkRowContent(2, [
        'Drag row',
        'Select',
        '',
        'Sub 1-1',
        dataWithNested[0].subRows[0].description,
        '5',
      ]);
      checkRowContent(3, [
        'Drag row',
        'Select',
        '',
        'Sub 1-2',
        dataWithNested[0].subRows[1].description,
        '7',
      ]);

      cy.get('th').contains('Title').realClick().realClick();

      checkRowContent(6, [
        'Drag row',
        'Select',
        'Group',
        'Group 1',
        dataWithNested[0].description,
        '10',
      ]);
      checkRowContent(7, [
        'Drag row',
        'Select',
        '',
        'Sub 1-2',
        dataWithNested[0].subRows[1].description,
        '7',
      ]);
      checkRowContent(8, [
        'Drag row',
        'Select',
        '',
        'Sub 1-1',
        dataWithNested[0].subRows[0].description,
        '5',
      ]);
    });

    it('should disable sorting when defined in the columns', () => {
      mount(<Basic />);
      cy.get('tr th').contains('Title').children().should('have.length', 1);
      cy.get('tr th').contains('Description').children().should('have.length', 0);
      cy.get('tr th').contains('Date added').children().should('have.length', 1);

      cy.get('th').contains('Description').realClick();
      checkRowContent(1, ['Entity 2', data[0].description, '2']);
    });

    it('Should sort the rows with the sorting state specified', () => {
      Basic.args.defaultSorting = [{ id: 'created', desc: false }];
      mount(<Basic />);

      checkRowContent(1, ['Entity 1', data[1].description, '1']);
      checkRowContent(2, ['Entity 2', data[0].description, '2']);
      checkRowContent(3, ['Entity 3', data[3].description, '3']);
    });

    it('should reset sorting state when using dnd after sorting', () => {
      Basic.args.dnd = { enable: true };
      mount(<Nested />);

      cy.contains('tr', 'Group 1').within(() => {
        cy.contains('button', 'Open group').realClick();
      });

      cy.get('th').contains('Title').realClick().realClick();
      cy.contains('Sorted by title');

      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(6),
        cy.get('button[aria-roledescription="sortable"]').eq(2)
      );

      cy.contains('No sorting');
    });

    it('it should sort items within groups', () => {
      Nested.args.dnd = { enable: false };
      Nested.args.enableSelections = false;
      mount(<Nested />);

      cy.contains('tr', 'Group 1').within(() => {
        cy.contains('button', 'Open group').realClick();
      });

      checkRowContent(1, ['Open group', 'Group 1', dataWithNested[0].description, '10']);
      checkRowContent(2, [undefined, 'Sub 1-1', dataWithNested[0].subRows[0].description, '5']);
      checkRowContent(3, [undefined, 'Sub 1-2', dataWithNested[0].subRows[1].description, '7']);

      cy.contains('th', 'Title').realClick().realClick();

      checkRowContent(6, ['Open group', 'Group 1', dataWithNested[0].description, '10']);
      checkRowContent(7, [undefined, 'Sub 1-2', dataWithNested[0].subRows[1].description, '7']);
      checkRowContent(8, [undefined, 'Sub 1-1', dataWithNested[0].subRows[0].description, '5']);
    });

    it('should allow manually controlling the sorting', () => {
      const setSortingSpy = cy.stub().as('setSortingSpy');
      Basic.args.sortingFn = setSortingSpy;

      mount(<Basic />);
      checkRowContent(1, ['Entity 2', data[0].description, '2']);
      cy.get('th').contains('Title').realClick();
      checkRowContent(1, ['Entity 2', data[0].description, '2']);

      cy.get('@setSortingSpy').should('have.been.calledTwice');
      cy.get('@setSortingSpy').should('have.been.calledWith', []);
      cy.get('@setSortingSpy').should('have.been.calledWith', [{ id: 'title', desc: false }]);
    });
  });

  describe('Selections', () => {
    beforeEach(() => {
      Basic.args.enableSelections = true;
      Basic.args.dnd = { enable: true };
      mount(<Basic />);
    });

    it('should select and unselect some items selections', () => {
      cy.contains('Select all').realClick();
      cy.get('tbody').within(() => {
        cy.get('input[type="checkbox"]').eq(0).uncheck();
        cy.get('input[type="checkbox"]').eq(2).uncheck();
      });
      cy.contains('button', 'Save changes').realClick();

      cy.get('[data-testid="selected-items"]').within(() => {
        cy.contains('Entity 1');
        cy.contains('Entity 2').should('not.exist');
        cy.contains('Entity 3');
        cy.contains('Entity 4').should('not.exist');
        cy.contains('Entity 5');
      });
    });

    it('should reset selections when adding a new entry to the table', () => {
      cy.contains('Select all').realClick();
      cy.contains('button', 'Save changes').realClick();
      cy.get('[data-testid="selected-items"]').within(() => {
        cy.contains('Entity 1');
        cy.contains('Entity 2');
        cy.contains('Entity 3');
        cy.contains('Entity 4');
        cy.contains('Entity 5');
      });
      cy.get('#checkbox-header').should('be.checked');

      cy.contains('button', 'Add new item').realClick();
      cy.get('#checkbox-header').should('not.be.checked');
    });

    it('should reset selections when removing an item from the table', () => {
      cy.contains('Select all').realClick();
      cy.contains('button', 'Save changes').realClick();
      cy.get('#checkbox-header').should('be.checked');
      cy.contains('button', 'Remove last item').realClick();
      cy.get('#checkbox-header').should('not.be.checked');
    });

    it('should not select items with disabled row selection', () => {
      Nested.args.enableSelections = true;
      Nested.args.dnd = { enable: true };
      Nested.args.tableData = tableWithDisabled;
      mount(<Nested />);
      cy.contains('Select all').realClick();
      cy.contains('button', 'Save changes').realClick();
      cy.get('[data-testid="selected-items"]').within(() => {
        cy.contains('Group 1');
        cy.contains('Group 2');
        cy.contains('Item 1').should('not.exist');
        cy.contains('Item 2');
      });
      cy.get('[data-testid="selected-subrows"]').within(() => {
        cy.contains('Sub 1-1').should('not.exist');
        cy.contains('Sub 1-2');
        cy.contains('Sub 1-3');
      });
    });

    it('should change parent status based on selected children', () => {
      Nested.args.enableSelections = true;
      Nested.args.dnd = { enable: true };
      Nested.args.tableData = tableWithDisabled;
      mount(<Nested />);

      cy.contains('tr', 'Group 1').within(() => {
        cy.contains('button', 'Open group').realClick();
        cy.get('input').realClick().should('be.checked');
      });
      cy.contains('tr', 'Sub 1-1').within(() => {
        cy.get('input').should('not.be.checked');
      });
      cy.contains('tr', 'Sub 1-2').within(() => {
        cy.get('input').should('be.checked');
        cy.get('input').realClick();
      });
      cy.contains('tr', 'Sub 1-3').within(() => {
        cy.get('input').should('be.checked');
        cy.get('input').realClick();
      });
      cy.contains('tr', 'Group 1').within(() => {
        cy.get('input').should('be.checked');
      });
    });
  });

  describe('DnD', () => {
    beforeEach(() => {
      Basic.args.dnd = { enable: true };
      Basic.args.enableSelections = true;
      Nested.args.tableData = dataWithNested;
      mount(<Basic />);
      cy.get('[data-testid="sorted-items"]').within(() => {
        cy.contains('Entity 2 Entity 1 Entity 4 Entity 3 Entity 5');
      });
    });

    it('should sort rows by dragging', () => {
      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(1),
        cy.get('button[aria-roledescription="sortable"]').eq(0)
      );

      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(3),
        cy.get('button[aria-roledescription="sortable"]').eq(2)
      );

      checkRowContent(1, ['Drag row', 'Select', 'Entity 1', data[1].description, '1']);
      checkRowContent(2, ['Drag row', 'Select', 'Entity 2', data[0].description, '2']);
      checkRowContent(3, ['Drag row', 'Select', 'Entity 3', data[3].description, '3']);
      checkRowContent(4, ['Drag row', 'Select', 'Entity 4', data[2].description, '4']);
      checkRowContent(5, ['Drag row', 'Select', 'Entity 5', data[4].description, '5']);

      cy.contains('button', 'Save changes').realClick();
      cy.get('[data-testid="sorted-items"]').within(() => {
        cy.contains('Entity 1 Entity 2 Entity 3 Entity 4 Entity 5');
      });
    });

    it('should keep selections while dragging', () => {
      cy.get('tbody').within(() => {
        cy.get('input[type="checkbox"]').eq(0).check();
        cy.get('input[type="checkbox"]').eq(2).check();
      });

      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(1),
        cy.get('button[aria-roledescription="sortable"]').eq(0)
      );

      cy.contains('button', 'Save changes').realClick();

      cy.get('[data-testid="selected-items"]').within(() => {
        cy.contains('Entity 1').should('not.exist');
        cy.contains('Entity 2');
        cy.contains('Entity 4');
        cy.contains('Entity 3').should('not.exist');
        cy.contains('Entity 5').should('not.exist');
      });

      cy.get('[data-testid="sorted-items"]').within(() => {
        cy.contains('Entity 1 Entity 2 Entity 4 Entity 3 Entity 5');
      });
    });
  });

  describe('Nested data', () => {
    beforeEach(() => {
      Nested.args.dnd = { enable: true };
      Nested.args.enableSelections = true;
      mount(<Nested />);
    });

    it('should check the content', () => {
      cy.get('[data-testid="sorted-items"]').within(() => {
        cy.contains('Group 1 Group 2 Group 3 Group 4 Item 1 Item 2');
      });
      checkRowContent(1, [
        'Drag row',
        'Select',
        'Group',
        'Group 1',
        dataWithNested[0].description,
        '10',
      ]);
      checkRowContent(2, [
        'Drag row',
        'Select',
        'Group',
        'Group 2',
        dataWithNested[1].description,
        '20',
      ]);
      checkRowContent(3, [
        'Drag row',
        'Select',
        'Group',
        'Group 3',
        dataWithNested[2].description,
        '30',
      ]);
      checkRowContent(4, [
        'Drag row',
        'Select',
        'Group',
        'Group 4',
        dataWithNested[3].description,
        '40',
      ]);
      checkRowContent(5, [
        'Drag row',
        'Select',
        undefined,
        'Item 1',
        dataWithNested[4].description,
        '50',
      ]);
      checkRowContent(6, [
        'Drag row',
        'Select',
        undefined,
        'Item 2',
        dataWithNested[5].description,
        '60',
      ]);
    });

    it('should expand groups and check for accessibility', () => {
      cy.get('tbody').within(() => {
        cy.contains('tr', 'Group 1').within(() => {
          cy.contains('button', 'Open group').realClick();
        });
        cy.contains('tr', 'Group 2').within(() => {
          cy.contains('button', 'Open group').realClick();
        });
        cy.contains('tr', 'Group 3').within(() => {
          cy.contains('button', 'Open group').realClick();
        });
        cy.contains('td', 'Sub 1-1');
        cy.contains('td', 'Sub 1-2');
        cy.contains('td', 'Sub 2-1');
        cy.contains('td', 'Sub 2-2');
        cy.contains('td', 'Sub 3-1');
        cy.contains('td', 'Sub 1-2');
      });

      cy.checkA11y();
    });

    it('should sort children element with dnd', () => {
      cy.get('tbody').within(() => {
        cy.contains('tr', 'Group 1').within(() => {
          cy.contains('Open group').realClick();
        });
        cy.contains('tr', 'Group 3').within(() => {
          cy.contains('Open group').realClick();
        });
        cy.contains('td', 'Sub 1-1');
        cy.contains('td', 'Sub 1-2');
        cy.contains('td', 'Sub 3-1');
        cy.contains('td', 'Sub 3-2');
      });

      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(5),
        cy.get('button[aria-roledescription="sortable"]').eq(1)
      );

      checkRowContent(1, [
        'Drag row',
        'Select',
        'Open group',
        'Group 1',
        dataWithNested[0].description,
        '10',
      ]);
      checkRowContent(2, [
        'Drag row',
        'Select',
        undefined,
        'Sub 3-1',
        dataWithNested[2].subRows[0].description,
        '12',
      ]);

      cy.contains('button', 'Save changes').realClick();

      cy.get('[data-testid="sorted-subrows"] > .flex > :nth-child(1)').contains(
        '|Group 1 - Sub 3-1|'
      );
    });

    it('should add an item to an empty group', () => {
      cy.contains('tr', 'Group 4').within(() => {
        cy.contains('button', 'Open group').realClick();
      });
      cy.contains('tr', 'Group 3').within(() => {
        cy.contains('button', 'Open group').realClick();
      });

      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(3),
        cy.get('td').contains('Empty group. Drop here to add')
      );

      checkRowContent(5, [
        'Drag row',
        'Select',
        'Open group',
        'Group 4',
        dataWithNested[3].description,
        '40',
      ]);
      checkRowContent(6, [
        'Drag row',
        'Select',
        undefined,
        'Sub 3-1',
        dataWithNested[2].subRows[0].description,
        '12',
      ]);
    });

    it('should empty a group by dragging all items out of it', () => {
      cy.contains('tr', 'Group 1').within(() => {
        cy.contains('button', 'Open group').realClick();
      });

      cy.contains('tr', 'Empty group. Drop here to add').should('not.exist');

      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(1),
        cy.get('button[aria-roledescription="sortable"]').eq(0)
      );
      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(2),
        cy.get('button[aria-roledescription="sortable"]').eq(0)
      );

      cy.contains('tr', 'Empty group. Drop here to add').should('exist');

      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(7),
        cy.get('td').contains('Empty group. Drop here to add')
      );

      checkRowContent(3, [
        'Drag row',
        'Select',
        'Open group',
        'Group 1',
        dataWithNested[0].description,
        '10',
      ]);
      checkRowContent(4, [
        'Drag row',
        'Select',
        undefined,
        'Item 2',
        dataWithNested[5].description,
        '60',
      ]);

      cy.contains('tr', 'Empty group. Drop here to add').should('not.exist');
    });

    it('should not loose selections when dragging into a dropzone', () => {
      cy.contains('tr', 'Group 4').within(() => {
        cy.contains('button', 'Open group').realClick();
      });

      cy.contains('tr', 'Item 2').within(() => {
        cy.get('input[type="checkbox"]').check();
      });

      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(5),
        cy.get('td').contains('Empty group. Drop here to add')
      );

      cy.contains('button', 'Save changes').realClick();

      cy.get('[data-testid="selected-subrows"]').within(() => {
        cy.contains('Item 2');
      });
    });

    it('should disable editing groups with dnd but allow sorting them internally', () => {
      Nested.args.dnd = { enable: true, disableEditingGroups: true };
      mount(<Nested />);

      cy.contains('tr', 'Group 4').within(() => {
        cy.contains('button', 'Open group').realClick();
      });

      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(5),
        cy.get('td').contains('Empty group. Drop here to add')
      );

      checkRowContent(5, ['Empty group. Drop here to add']);

      cy.contains('tr', 'Group 2').within(() => {
        cy.contains('button', 'Open group').realClick();
      });

      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(7),
        cy.get('td').contains('Sub 2-1')
      );

      checkRowContent(2, ['Drag row', 'Select', 'Group', 'Group 2']);
      checkRowContent(3, ['Drag row', 'Select', '', 'Sub 2-1']);
      checkRowContent(4, ['Drag row', 'Select', '', 'Sub 2-2']);
      checkRowContent(9, ['Drag row', 'Select', '', 'Item 2']);

      cy.realDragAndDrop(
        cy.get('button[aria-roledescription="sortable"]').eq(2),
        cy.get('td').contains('Sub 2-2')
      );

      checkRowContent(3, ['Drag row', 'Select', '', 'Sub 2-2']);
      checkRowContent(4, ['Drag row', 'Select', '', 'Sub 2-1']);
    });

    it('should render the correct text for empty groups based on dnd status', () => {
      Nested.args.dnd = { enable: false };
      Nested.args.enableSelections = false;
      mount(<Nested />);

      cy.contains('tr', 'Group 4').within(() => {
        cy.contains('button', 'Open group').realClick();
      });

      cy.contains('This group is empty');
    });
  });
});
