/**
 * @jest-environment jsdom
 */
import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../utils/test/renderConnect... Remove this comment to see the full error message
import { renderConnectedMount } from '../../utils/test/renderConnected.js';
import { ErrorFallback } from '../ErrorFallback';
import { RouteErrorBoundary } from '../RouteErrorBoundary';

let error: any = null;

const mockUseRouteError = jest.fn().mockImplementation(() => error);

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useRouteError: () => mockUseRouteError(),
}));

describe('ErrorBoundary', () => {
  const controlledComponent = (
    <RouteErrorBoundary>
      <span>Content</span>
    </RouteErrorBoundary>
  );

  it('should show the nested children if no errors', () => {
    const component = renderConnectedMount(() => controlledComponent, {}, {}, true);
    expect(component.text()).toContain('Content');
  });

  it('should show a fallback component when a nested component fails', () => {
    error = { message: 'error at rendering' };
    const component = renderConnectedMount(() => controlledComponent, {}, {}, true);
    expect(component.text()).not.toContain('Content');
    const errorProps = component.find(ErrorFallback).at(0).props();
    expect(errorProps.error.message).toEqual('error at rendering');
  });
});
