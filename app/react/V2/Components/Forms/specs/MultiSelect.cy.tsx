import React from 'react';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/testing-react';
import * as stories from 'app/stories/Forms/MultiSelect.stories';

const { Basic: MultiSelect } = composeStories(stories);

describe('MultiSelect', () => {
  describe('Rendering', () => {
    beforeEach(() => {
      mount(<MultiSelect />);
    });

    it('should render context menu when button clicked', () => {
      cy.get('[data-testid="multiselect-comp"] button').click();
      cy.get('ul li').should('have.length', 19);
    });

    it('should close when clicking on the open button again', () => {
      cy.get('[data-testid="multiselect-comp"] button').click();
      cy.get('[data-testid="multiselect-comp"] button').click();
      cy.get('ul li').should('not.exist');
    });

    it('should close when clicking outside of the component', () => {
      cy.get('[data-testid="multiselect-comp"] button').click();
      cy.contains('h1', 'Multiselect component').click();
      cy.get('ul li').should('not.exist');
    });

    it('should not close when clicking elements within the component', () => {
      cy.get('[data-testid="multiselect-comp"] button').click();
      cy.get('ul li').get('input').eq(1).click();
      cy.get('ul li').get('input').eq(2).click();

      cy.contains('div', 'Groups').click();
      cy.get('[data-testid="pill-comp"]')
        .eq(0)
        .within(() => {
          cy.get('button').click();
        });

      cy.get('ul li').should('have.length', 19);
    });

    it('should sort the option by label', () => {
      cy.get('[data-testid="multiselect-comp"] button').click();
      cy.get('ul li').get('span').eq(1).should('contain', 'And another');
      cy.get('ul li').get('span').eq(2).should('contain', 'Another');
      cy.get('ul li').get('span').eq(19).should('contain', 'Someone');
    });

    it('should position the menu inside the viewport', () => {});
  });

  describe('Main area', () => {
    beforeEach(() => {
      mount(<MultiSelect />);
      cy.get('[data-testid="multiselect-comp"] button').click();
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
    // it('should execute the onchange action when adding or removing items and return the updated options', () => {
    //   const onChangeSpy = cy.spy();
    //   mount(
    //     <MultiSelect
    //       onChange={options => {
    //         onChangeSpy(options);
    //       }}
    //     />
    //   );
    //   cy.get('[data-testid="multiselect-comp"] button').click();
    //   cy.get('ul li')
    //     .get('input')
    //     .eq(1)
    //     .click()
    //     .then(() => {
    //       // eslint-disable-next-line no-unused-expressions
    //       expect(onChangeSpy).to.have.been.calledOnce;
    //       const args = onChangeSpy.args[0];
    //       console.log(some(args, { label: 'Another', value: 'another', selected: true }));
    //       // eslint-disable-next-line no-unused-expressions
    //       // expect().to.be.true;
    //     });
    // });
  });
});
