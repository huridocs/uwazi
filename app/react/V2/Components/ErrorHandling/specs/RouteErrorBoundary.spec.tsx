/**
 * @jest-environment jsdom
 */
import React, { Component } from 'react';
import { RouteErrorBoundary } from 'app/App/ErrorHandling/RouteErrorBoundary';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';
import { renderConnectedMount } from 'app/utils/test/renderConnected';

let error: any = null;

const mockUseRouteError = jest.fn().mockImplementation(() => error);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useRouteError: () => mockUseRouteError(),
}));

describe('ErrorBoundary', () => {
  class ComponentWithError extends Component {
    render() {
      return (
        <div>
          <span>content</span>
        </div>
      );
    }
  }

  const controlledComponent = (
    <RouteErrorBoundary>
      <ComponentWithError />
    </RouteErrorBoundary>
  );

  it('should show the nested children if no errors', () => {
    const component = renderConnectedMount(() => controlledComponent, {}, {}, true);
    expect(component.text()).toContain('content');
  });

  it('should show a fallback component when a nested component fails', () => {
    error = { message: 'error at rendering' };
    const component = renderConnectedMount(() => controlledComponent, {}, {}, true);
    expect(component.text()).not.toContain('content');
    const errorProps = component.find(ErrorFallback).at(0).props();
    expect(errorProps.error.message).toEqual('error at rendering');
  });
});
