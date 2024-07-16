/* eslint-disable max-statements */
import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { map } from 'lodash';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/TableV2.stories';

const { Basic, Nested } = composeStories(stories);

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

  it('Should return a table with the columns and row specified', () => {
    Basic.args.checkboxes = false;
    Basic.args.enableDnd = false;
    mount(<Basic />);
    const toStrings = (cells: JQuery<HTMLElement>) => map(cells, 'textContent');
    cy.get('tr th').then(toStrings).should('eql', ['Title', 'Description', 'Date added']);

    checkRowContent(1, ['Entity 2', data[0].description, '2']);
    checkRowContent(2, ['Entity 1', data[1].description, '1']);
    checkRowContent(3, ['Entity 4', data[2].description, '4']);
    checkRowContent(4, ['Entity 3', data[3].description, '3']);
    checkRowContent(5, ['Entity 5', data[4].description, '5']);
  });

  xit('should render the data in a custom component', () => {
    mount(<Basic />);
    cy.get('tbody > :nth-child(1) > :nth-child(3) > div').should(
      'have.class',
      'text-center text-white bg-gray-400 rounded'
    );
  });

  xit('should render the header appending custom styles passed in the definition of the columns', () => {
    mount(<WithActions />);
    cy.get('table > thead > tr > th:nth-child(3)').should(
      'have.class',
      'px-6 py-3 w-1/4 bg-error-100 text-blue-600'
    );
  });

  describe('Sorting', () => {
    after(() => {
      Basic.args.defaultSorting = undefined;
      Basic.args.checkboxes = false;
      Basic.args.enableDnd = false;
    });

    it('Should be sortable by title', () => {
      Basic.args.checkboxes = false;
      Basic.args.enableDnd = false;
      mount(<Basic />);

      cy.get('th').contains('Title').click();

      checkRowContent(1, ['Entity 1', data[1].description, '1']);
      checkRowContent(2, ['Entity 2', data[0].description, '2']);
      checkRowContent(3, ['Entity 3', data[3].description, '3']);
      checkRowContent(4, ['Entity 4', data[2].description, '4']);
      checkRowContent(5, ['Entity 5', data[4].description, '5']);
    });

    it('should return to the default sorting', () => {
      Basic.args.checkboxes = false;
      Basic.args.enableDnd = false;
      mount(<Basic />);
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('th').contains('Title').click().click().click();

      checkRowContent(1, ['Entity 2', data[0].description, '2']);
      checkRowContent(2, ['Entity 1', data[1].description, '1']);
      checkRowContent(3, ['Entity 4', data[2].description, '4']);
      checkRowContent(4, ['Entity 3', data[3].description, '3']);
      checkRowContent(5, ['Entity 5', data[4].description, '5']);
    });

    it('should keep selections when sorting', () => {
      Basic.args.checkboxes = true;
      Basic.args.enableDnd = false;
      mount(<Basic />);

      cy.get('tbody').within(() => {
        cy.get('input[type="checkbox"]').eq(0).check();
        cy.get('input[type="checkbox"]').eq(2).check();
      });

      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('th').contains('Title').click().click();

      cy.get('[data-testid="selected-items"]').within(() => {
        cy.contains('Entity 2');
        cy.contains('Entity 4');
      });
    });

    it('should sort items in groups', () => {
      mount(<Nested />);
      cy.contains('Open group 1').click();

      checkRowContent(1, [
        'Drag row 1',
        'Select',
        'Group',
        'Group 1',
        dataWithNested[0].description,
        '10',
      ]);
      checkRowContent(2, [
        'Drag row 1-1',
        'Select',
        '',
        'Sub 1-1',
        dataWithNested[0].subRows[0].description,
        '5',
      ]);
      checkRowContent(3, [
        'Drag row 1-2',
        'Select',
        '',
        'Sub 1-2',
        dataWithNested[0].subRows[1].description,
        '7',
      ]);

      cy.get('th').contains('Title').click().click();

      checkRowContent(6, [
        'Drag row 6',
        'Select',
        'Group',
        'Group 1',
        dataWithNested[0].description,
        '10',
      ]);
      checkRowContent(7, [
        'Drag row 6-1',
        'Select',
        '',
        'Sub 1-2',
        dataWithNested[0].subRows[1].description,
        '7',
      ]);
      checkRowContent(8, [
        'Drag row 6-2',
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

      cy.get('th').contains('Description').click();
      checkRowContent(1, ['Select', 'Entity 2', data[0].description, '2']);
    });

    xit('should allow external control of sorting', () => {
      const setSortingSpy = cy.stub().as('setSortingSpy');

      mount(<Basic setSorting={setSortingSpy} />);
      cy.get('tr th').contains('Title').click();

      cy.get('@setSortingSpy').should('have.been.calledOnce');
    });

    it('Should sort the rows with the sorting state specified', () => {
      Basic.args.checkboxes = false;
      Basic.args.enableDnd = false;
      Basic.args.defaultSorting = [{ id: 'created', desc: false }];
      mount(<Basic />);

      checkRowContent(1, ['Entity 1', data[1].description, '1']);
      checkRowContent(2, ['Entity 2', data[0].description, '2']);
      checkRowContent(3, ['Entity 3', data[3].description, '3']);
    });

    it('should reset sorting state when using dnd after sorting', () => {
      Basic.args.defaultSorting = undefined;
      Basic.args.checkboxes = false;
      Basic.args.enableDnd = true;

      mount(<Nested />);
      cy.contains('Open group 1').click();
      // eslint-disable-next-line cypress/unsafe-to-chain-command
      cy.get('th').contains('Title').click().click();
    });
  });

  describe('Selections', () => {
    beforeEach(() => {
      Basic.args.checkboxes = true;
      Basic.args.enableDnd = true;
      mount(<Basic />);
      cy.contains('Select all').click();
      cy.get('tbody').within(() => {
        cy.get('input[type="checkbox"]').eq(0).uncheck();
        cy.get('input[type="checkbox"]').eq(2).uncheck();
      });
    });

    it('should select and uselect some items', () => {
      cy.get('[data-testid="selected-items"]').within(() => {
        cy.contains('Entity 1');
        cy.contains('Entity 2').should('not.exist');
        cy.contains('Entity 3');
        cy.contains('Entity 4').should('not.exist');
        cy.contains('Entity 5');
      });
    });

    it('should reset selections when data changes', () => {
      cy.contains('button', 'Add new item').click();
      cy.get('[data-testid="selected-items"] > div').should('be.empty');
    });
  });

  describe('DnD', () => {
    beforeEach(() => {
      Basic.args.enableDnd = true;
      mount(<Basic />);
      cy.get('[data-testid="sorted-items"]').within(() => {
        cy.contains('Entity 2 Entity 1 Entity 4 Entity 3 Entity 5');
      });
    });

    it('should sort rows by dragging', () => {
      cy.contains('button', 'Drag row 2').drag('button:contains("Drag row 1")', {
        target: { x: 5, y: 0 },
        force: true,
      });

      cy.get('[data-testid="sorted-items"]').within(() => {
        cy.contains('Entity 1 Entity 2 Entity 4 Entity 3 Entity 5');
      });

      cy.contains('button', 'Drag row 3').drag('button:contains("Drag row 4")', {
        target: { x: 5, y: 0 },
        force: true,
      });

      cy.get('[data-testid="sorted-items"]').within(() => {
        cy.contains('Entity 1 Entity 2 Entity 3 Entity 4 Entity 5');
      });

      checkRowContent(1, ['Drag row 1', 'Select', 'Entity 1', data[1].description, '1']);
      checkRowContent(2, ['Drag row 2', 'Select', 'Entity 2', data[0].description, '2']);
      checkRowContent(3, ['Drag row 3', 'Select', 'Entity 3', data[3].description, '3']);
      checkRowContent(4, ['Drag row 4', 'Select', 'Entity 4', data[2].description, '4']);
      checkRowContent(5, ['Drag row 5', 'Select', 'Entity 5', data[4].description, '5']);
    });

    it('should keep selections while dragging', () => {
      cy.get('tbody').within(() => {
        cy.get('input[type="checkbox"]').eq(0).check();
        cy.get('input[type="checkbox"]').eq(2).check();
      });

      cy.contains('button', 'Drag row 2').drag('button:contains("Drag row 1")', {
        target: { x: 5, y: 0 },
        force: true,
      });

      cy.contains('button', 'Drag row 3').drag('button:contains("Drag row 4")', {
        target: { x: 5, y: 0 },
        force: true,
      });

      cy.get('[data-testid="selected-items"]').within(() => {
        cy.contains('Entity 1').should('not.exist');
        cy.contains('Entity 2');
        cy.contains('Entity 3').should('not.exist');
        cy.contains('Entity 4');
        cy.contains('Entity 5').should('not.exist');
      });
    });

    it('should add an item to an empty group', () => {});

    it('should empty a group by dragging all items out of it', () => {});

    it('should not loose selections when dragging into a dropzone', () => {});
  });

  describe('Nested data', () => {
    beforeEach(() => {
      Nested.args.enableDnd = true;
      Nested.args.checkboxes = true;
      mount(<Nested />);
    });

    it('should check the content', () => {
      cy.get('[data-testid="sorted-items"]').within(() => {
        cy.contains('Group 1 Group 2 Group 3 Group 4 Item 1 Item 2');
      });
      checkRowContent(1, [
        'Drag row 1',
        'Select',
        'Group',
        'Group 1',
        dataWithNested[0].description,
        '10',
      ]);
      checkRowContent(2, [
        'Drag row 2',
        'Select',
        'Group',
        'Group 2',
        dataWithNested[1].description,
        '20',
      ]);
      checkRowContent(3, [
        'Drag row 3',
        'Select',
        'Group',
        'Group 3',
        dataWithNested[2].description,
        '30',
      ]);
      checkRowContent(4, [
        'Drag row 4',
        'Select',
        'Group',
        'Group 4',
        dataWithNested[3].description,
        '40',
      ]);
      checkRowContent(5, [
        'Drag row 5',
        'Select',
        undefined,
        'Item 1',
        dataWithNested[4].description,
        '50',
      ]);
      checkRowContent(6, [
        'Drag row 6',
        'Select',
        undefined,
        'Item 2',
        dataWithNested[5].description,
        '60',
      ]);
    });

    it('should expand groups and check for accessibility', () => {
      cy.get('tbody').within(() => {
        cy.contains('Open group 1').click();
        cy.contains('Open group 2').click();
        cy.contains('Open group 3').click();
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
        cy.contains('Open group 1').click();
        cy.contains('Open group 3').click();
        cy.contains('td', 'Sub 1-1');
        cy.contains('td', 'Sub 1-2');
        cy.contains('td', 'Sub 3-1');
        cy.contains('td', 'Sub 3-2');
      });

      cy.contains('button', 'Drag row 3-1').drag('button:contains("Drag row 1-1")', {
        target: { x: 5, y: 0 },
        force: true,
      });

      checkRowContent(1, [
        'Drag row 1',
        'Select',
        'Open group 1',
        'Group 1',
        dataWithNested[0].description,
        '10',
      ]);
      checkRowContent(2, [
        'Drag row 1-1',
        'Select',
        undefined,
        'Sub 3-1',
        dataWithNested[2].subRows[0].description,
        '12',
      ]);

      cy.get('[data-testid="sorted-subrows"] > .flex > :nth-child(1)').contains(
        '|Group 1 - Sub 3-1|'
      );
    });

    // xit('should sort an expanded row by the header', () => {
    //   mount(<NestedDnD />);
    //   cy.contains('children').click();
    //   cy.get('[data-testid="created_false"]').click();
    //   cy.contains('children').click();
    //   checkRowContent(1, ['Entity 3', data[2].description, '3']);
    //   checkRowContent(2, ['Entity 2', data[0].description, '2']);
    //   checkRowContent(3, ['Entity 1', data[1].description, '1']);
    //   checkRowContent(4, ['Entity a', data[1].children![0].description, '4']);
    //   checkRowContent(5, ['Entity b', data[1].children![1].description, '5']);
    // });

    // const checkChildrenSorting = (from: string, to: string, target: { x: number; y: number }) => {
    //   mount(<NestedDnD />);

    //   cy.contains('children').click();
    //   cy.get(from).drag(to, {
    //     target,
    //     force: true,
    //   });

    //   checkRowContent(1, ['Entity 2', data[0].description, '2']);
    //   checkRowContent(2, ['Entity 1', data[1].description, '1']);
    //   checkRowContent(3, ['Entity b', data[1].children![1].description, '5']);
    //   checkRowContent(4, ['Entity a', data[1].children![0].description, '4']);
    //   checkRowContent(5, ['Entity 3', data[2].description, '3']);

    //   cy.get('[data-testid="update_items"] > ul > li')
    //     .should('have.length', 3)
    //     .then($els => Cypress.$.makeArray($els).map(el => el.innerText))
    //     .should('deep.equal', ['Entity 2', 'Entity 1 Entity b, Entity a', 'Entity 3']);
    // };

    // xit('should sort children of a group from top to bottom', () => {
    //   checkChildrenSorting(
    //     '[data-testid="group_1-draggable-item-0"]',
    //     '[data-testid="group_1.1"]',
    //     { x: 5, y: 30 }
    //   );
    // });

    // xit('should sort children of a group from bottom to top', () => {
    //   checkChildrenSorting(
    //     '[data-testid="group_1-draggable-item-1"]',
    //     '[data-testid="group_1.0"]',
    //     { x: 5, y: 0 }
    //   );
    // });

    // xit('should move a parent into a group', () => {
    //   mount(<NestedDnD />);
    //   cy.contains('children').click();

    //   cy.get('[data-testid="root-draggable-item-0"]').trigger('dragstart');
    //   cy.get('[data-testid="root-draggable-item-0"]').trigger('dragleave');
    //   cy.get('[data-testid="group_1.0"]').trigger('drop', {
    //     target: { x: 5, y: 0 },
    //   });
    //   cy.get('[data-testid="root-draggable-item-0"]').trigger('dragend');
    //   cy.contains('children').click();
    //   checkRowContent(1, ['Entity 1', data[1].description, '1']);
    //   checkRowContent(2, ['Entity a', data[1].children![0].description, '4']);
    //   checkRowContent(3, ['Entity b', data[1].children![1].description, '5']);
    //   checkRowContent(4, ['Entity 2', data[0].description, '2']);
    //   checkRowContent(5, ['Entity 3', data[2].description, '3']);

    //   cy.get('[data-testid="update_items"] > ul > li')
    //     .should('have.length', 2)
    //     .then($els => Cypress.$.makeArray($els).map(el => el.innerText))
    //     .should('deep.equal', ['Entity 1 Entity a, Entity b, Entity 2', 'Entity 3']);
    // });

    // xit('should move a child outsides a group', () => {
    //   mount(<NestedDnD />);
    //   cy.contains('children').click();

    //   cy.get('[data-testid="group_1-draggable-item-0"]').drag(
    //     '[data-testid="root-draggable-item-0"]',
    //     {
    //       target: { x: 5, y: 0 },
    //       force: true,
    //     }
    //   );
    //   cy.get('[data-testid="group_1-draggable-item-0"]').trigger('dragend');
    //   cy.contains('children').click();
    //   checkRowContent(1, ['Entity 2', data[0].description, '2']);
    //   checkRowContent(2, ['Entity 1', data[1].description, '1']);
    //   checkRowContent(3, ['Entity 3', data[2].description, '3']);
    //   checkRowContent(4, ['Entity a', data[1].children![0].description, '4']);

    //   cy.get('[data-testid="update_items"] > ul > li')
    //     .should('have.length', 4)
    //     .then($els => Cypress.$.makeArray($els).map(el => el.innerText))
    //     .should('deep.equal', ['Entity 2', 'Entity 1 Entity b', 'Entity 3', 'Entity a']);
    // });

    // xdescribe('Fixed groups', () => {
    //   it('should not move a child outsides a group if editableGroups is false', () => {
    //     mount(<NestedDnD allowEditGroupsWithDnD={false} />);
    //     cy.contains('children').click();

    //     cy.get('[data-testid="group_1-draggable-item-0"]').drag(
    //       '[data-testid="root-draggable-item-1"]',
    //       {
    //         target: { x: 5, y: 0 },
    //         force: true,
    //       }
    //     );
    //     cy.get('[data-testid="group_1-draggable-item-0"]').trigger('dragend');
    //     checkRowContent(1, ['Entity 2', data[0].description, '2']);
    //     checkRowContent(2, ['Entity 1', data[1].description, '1']);
    //     checkRowContent(3, ['Entity a', data[1].children![0].description, '4']);
    //     checkRowContent(4, ['Entity b', data[1].children![1].description, '5']);
    //     checkRowContent(5, ['Entity 3', data[2].description, '3']);
    //   });
    // });
  });
});
