/**
 * @jest-environment jsdom
 */
import React from 'react';
import { ApiError } from '#shared/apiClient/index.js';
import { defaultState, renderConnectedContainer } from '#app/utils/test/renderConnected.js';
import { RouteErrorBoundary } from '../RouteErrorBoundary.js';

let error: any = null;

const mockUseRouteError = jest.fn().mockImplementation(() => error);

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useRouteError: () => mockUseRouteError(),
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    error = null;
  });

  const renderBoundary = () =>
    renderConnectedContainer(
      <RouteErrorBoundary>
        <span>Content</span>
      </RouteErrorBoundary>,
      () => defaultState
    );

  it('should show the nested children if no errors', () => {
    const { renderResult } = renderBoundary();
    expect(renderResult.getByText('Content')).toBeInTheDocument();
  });

  it('should show a fallback component when a nested component fails', () => {
    error = { message: 'error at rendering' };
    const { renderResult } = renderBoundary();
    expect(renderResult.queryByText('Content')).toBeNull();
    expect(renderResult.container.textContent).toContain('error at rendering');
  });

  it('should normalize ApiError for ErrorFallback', () => {
    error = new ApiError('Not found', {
      kind: 'http',
      status: 404,
      detail: 'Thesauri missing',
      requestId: 'req-1',
    });
    const { renderResult } = renderBoundary();
    expect(renderResult.getByText('Thesauri missing')).toBeInTheDocument();
  });

  it('should normalize route ErrorResponse for ErrorFallback', () => {
    error = {
      status: 404,
      statusText: 'Failed to load plaintext',
      data: { error: 'Failed to load plaintext', message: 'Plaintext missing' },
      internal: true,
    };
    const { renderResult } = renderBoundary();
    expect(renderResult.getByText('Plaintext missing')).toBeInTheDocument();
  });
});
