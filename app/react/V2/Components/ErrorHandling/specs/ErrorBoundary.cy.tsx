import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/ErrorBoundary.stories';

const { BasicErrorBoundary } = composeStories(stories);

const FragileComponent = ({ source }: { source?: { text: string } }) => (
  <div>
    {/* @ts-expect-error */}
    <span>this works {source.text}</span>
  </div>
);

describe('ErrorBoundary', () => {
  it('should show the nested children if no errors', () => {
    mount(
      <BasicErrorBoundary error={undefined}>
        <FragileComponent source={{ text: 'well' }} />
      </BasicErrorBoundary>
    );
    cy.contains('this works well').should('exist');
  });

  it('should show a fallback component when a nested component fails', () => {
    mount(
      <BasicErrorBoundary error={undefined}>
        <FragileComponent source={undefined} />
      </BasicErrorBoundary>
    );
    cy.on('uncaught:exception', (_err, _runnable) => {
      cy.contains('this works').should('not.exist');
      cy.contains('Well, this is awkward...').should('exist');
      cy.contains("Cannot read properties of undefined (reading 'text')").should('exist');
      return false;
    });
  });

  it('should show a fallback component for a 500 status', () => {
    mount(<BasicErrorBoundary />);
    cy.contains('500');
    cy.contains('Unexpected error');
    cy.contains('Something went wrong');
  });

  it('should show a fallback component for a 404 status', () => {
    mount(
      <BasicErrorBoundary
        error={{ status: 404, message: 'missing file', requestId: '123', name: 'ServerError' }}
      />
    );
    cy.contains('404');
    cy.contains('Not Found');
    cy.contains("We can't find the page you're looking for.");
  });
});
