import React from 'react';
import { mount } from '@cypress/react18';
import { Provider } from 'react-redux';
import * as ReactRouterDom from 'react-router-dom';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

import { TwoFactorSetup } from '../TwoFactorSetup';

describe('TwoFactorSetup', () => {
  let closePanel;
  const Component = () => {
    closePanel = cy.stub();
    cy.stub(ReactRouterDom, 'useRevalidator').returns(() => {});

    return (
      <Provider store={createStore()}>
        <div className="tw-content">
          <TwoFactorSetup closePanel={closePanel} />
        </div>
      </Provider>
    );
  };

  before(() => {
    cy.viewport(500, 500);
    cy.intercept('GET', '/api/auth2fa-secret', {
      otpauth: 'otpauth://totp/Uwazi:admin?secret=HAZTOWDVJ5YUI6KTJVCHIMZRMNNHIOC2&issuer=Uwazi',
      secret: 'HAZTOWDVJ5YUI6KTJVCHIMZRMNNHIOC2',
    }).as('getSecret');
  });

  beforeEach(() => {
    mount(<Component />);
  });

  it('Should request for a new secret and oauth', () => {
    cy.wait('@getSecret');
  });
});
