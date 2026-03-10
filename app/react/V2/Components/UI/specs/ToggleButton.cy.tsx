import React, { useState } from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { ToggleButton } from '../ToggleButton';

describe('ToggleButton', () => {
  let isDisabled = false;

  const Component = () => {
    const [show, setShow] = useState(false);

    return (
      <div className="tw-content">
        <ToggleButton onToggle={() => setShow(!show)} disabled={isDisabled}>
          <span className="ml-3">My toggle button</span>
        </ToggleButton>
        {show && <p className="pt-3">This text appears and hides using the above toggle</p>}
      </div>
    );
  };

  it('should be accessible', () => {
    mount(<Component />);
    cy.injectAxe();
    cy.checkA11y();
  });

  it('should show and hide the text when toggled', () => {
    mount(<Component />);
    cy.contains('My toggle button').click();
    cy.contains('This text appears and hides using the above toggle').should('exist');

    cy.contains('My toggle button').click();
    cy.contains('This text appears and hides using the above toggle').should('not.exist');
  });

  it('should not work when disabled', () => {
    isDisabled = true;
    mount(<Component />);
    cy.contains('My toggle button').click();
    cy.contains('This text appears and hides using the above toggle').should('not.exist');
  });
});
