import React from 'react';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Forms/RadioSelect.stories';

const { Basic, Horizontal } = composeStories(stories);

describe('RadioSelect', () => {
  beforeEach(() => {
    mount(<Basic />);
  });

  it('should show all the options', () => {
    cy.get('input[type="radio"]').should(list => {
      expect(list[0].nextSibling?.textContent).to.equal('USA');
      expect(list[1].nextSibling?.textContent).to.equal('Germany');
      expect(list[2].nextSibling?.textContent).to.equal('Spain');
      expect(list[3].nextSibling?.textContent).to.equal('United Kingdom');
      expect(list[4].nextSibling?.textContent).to.equal('China');
    });
  });

  it('should be vertical by default', () => {
    cy.get('fieldset').should('have.class', 'flex-col max-w-md');
    cy.get('fieldset > div').should('not.have.class', 'mr-4');
  });

  it('should have checked the default checked property', () => {
    cy.get('input[type="radio"]:checked').siblings().contains('Spain');
  });

  it('should disable the options specified', () => {
    cy.get('input[type="radio"]:disabled').siblings().contains('United Kingdom');
    cy.get('input[type="radio"]:disabled').siblings().should('have.class', '!text-gray-300');
  });

  it('should execute on change when the selected option changes', () => {
    cy.get('input[type="radio"]').invoke('on', 'change', cy.stub().as('change'));
    cy.get('input[type="radio"]').eq(1).check();
    cy.get('@change').should('have.been.called');
  });
});

describe('RadioSelect Horizontal', () => {
  beforeEach(() => {
    mount(<Horizontal />);
  });

  it('should be horizontal if specified', () => {
    cy.get('fieldset').should('not.have.class', 'flex-col max-w-md');
    cy.get('fieldset > div').should('have.class', 'mr-4');
  });
});
