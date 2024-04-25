import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { CopyValueInput } from '../CopyValueInput';

describe('CopyValueInput', () => {
  const Component = () => (
    <Provider store={createStore()}>
      <div className="tw-content" style={{ height: '200px', paddingTop: '40px' }}>
        <CopyValueInput label="name" value="some testing value" id="my-value" />
      </div>
    </Provider>
  );

  before(() => {
    cy.viewport(500, 500);
    cy.wrap(
      Cypress.automation('remote:debugger:protocol', {
        command: 'Browser.grantPermissions',
        params: {
          permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
          origin: window.location.origin,
        },
      })
    );
  });

  beforeEach(() => {
    mount(<Component />);
  });

  it('should be accessible', () => {
    cy.injectAxe();
    cy.checkA11y();
  });

  it('Should copy the value to clipboard when clicking the button', () => {
    cy.window().focus();
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get('[data-testid="copy-value-button"]').focus().dblclick();
    cy.window()
      .then(async win => {
        win.focus();
        return win.navigator.clipboard.readText();
      })
      .should('equal', 'some testing value');
  });
});
