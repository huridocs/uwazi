import React from 'react';
import { mount } from '@cypress/react18';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { CopyValueInput } from '../CopyValueInput';
import { isPermissionAllowed } from 'cypress-browser-permissions';

describe('CopyValueInput', () => {
  const Component = () => (
    <Provider store={createStore()}>
      <div className="tw-content" style={{ height: '200px', paddingTop: '40px' }}>
        <CopyValueInput label="name" value="some testing value" />
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

  it('Should copy the value to clipboard when clicking the button', () => {
    cy.get('[data-testid="copy-value-button"]').click();
    cy.window()
      .then(async win => win.navigator.clipboard.readText())
      .should('equal', 'some testing value');
  });
});
