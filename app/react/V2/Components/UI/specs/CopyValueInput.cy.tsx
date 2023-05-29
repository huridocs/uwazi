import React from 'react';
import { mount } from '@cypress/react18';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { CopyValueInput } from '../CopyValueInput';

describe('CopyValueInput', () => {
  const Component = () => (
    <Provider store={createStore()}>
      <div className="tw-content" style={{ height: '200px', paddingTop: '40px' }}>
        <CopyValueInput value="some testing value" />
      </div>
    </Provider>
  );

  before(() => {
    cy.viewport(500, 500);
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
