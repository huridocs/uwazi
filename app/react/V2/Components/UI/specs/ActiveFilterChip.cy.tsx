import React, { useState } from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { ActiveFilterChip } from '../ActiveFilterChip.js';

describe('ActiveFilterChip', () => {
  const ChipHarness = ({
    label = 'Person',
    color,
    removeAriaLabel,
  }: {
    label?: string;
    color?: string;
    removeAriaLabel?: string;
  }) => {
    const [visible, setVisible] = useState(true);
    if (!visible) return null;
    return (
      <div className="tw-content p-4">
        <ActiveFilterChip
          label={label}
          color={color}
          removeAriaLabel={removeAriaLabel}
          onRemove={() => setVisible(false)}
        />
      </div>
    );
  };

  it('should be accessible', () => {
    mount(<ChipHarness color="#f59e0b" />);
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should render the label', () => {
    mount(<ChipHarness label="Z → A" />);
    cy.contains('Z → A').should('be.visible');
  });

  it('should remove the chip when clicking remove', () => {
    mount(<ChipHarness />);
    cy.get('[aria-label="Remove filter"]').click();
    cy.contains('Person').should('not.exist');
  });

  it('should use a custom remove aria label', () => {
    mount(<ChipHarness removeAriaLabel="Remove sort filter" />);
    cy.get('[aria-label="Remove sort filter"]').click();
    cy.contains('Person').should('not.exist');
  });

  it('should render a color marker when color is provided', () => {
    mount(<ChipHarness color="#f59e0b" />);
    cy.get('[aria-hidden]').should('have.attr', 'style').and('include', 'background-color');
  });
});
