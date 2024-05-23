/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { renderConnectedContainer, defaultState } from 'app/utils/test/renderConnected';
import { fromJS } from 'immutable';
import { GeneralError } from '../GeneralError';

let requestId = '';
let errorCode = 500;

const mockUseSearchParams = jest.fn().mockImplementation(() => {
  const params = new Map();
  if (requestId) {
    params.set('requestId', requestId);
  }
  return [params];
});

const mockUseParams = jest.fn().mockImplementation(() => ({
  errorCode,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    search: '?q=(requestId:%271234%27)',
  }),
  useSearchParams: () => mockUseSearchParams(),
  useParams: () => mockUseParams(),
}));

describe('General Error', () => {
  beforeEach(() => {
    requestId = '';
    errorCode = 500;
  });

  const state = {
    ...defaultState,
    connections: { connection: fromJS({}) },
    user: fromJS({ _id: 'user1' }),
    settings: { collection: fromJS({}) },
  };

  describe('when a page could not be rendered at server', () => {
    it('should show render an ErrorFallback with the error', () => {
      requestId = '1234';
      renderConnectedContainer(<GeneralError />, () => state, 'BrowserRouter');
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('Unexpected error')).toBeInTheDocument();
      expect(screen.getByTestId('errorInfo')).toHaveTextContent(
        'Something went wrong. Request id #1234'
      );
    });

    it('should pass a 404 code if received code is not supported', () => {
      errorCode = 422;
      renderConnectedContainer(<GeneralError />, () => state, 'BrowserRouter');
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Not Found')).toBeInTheDocument();
      expect(screen.getByText("We can't find the page you're looking for.")).toBeInTheDocument();
      expect(screen.queryByText('Request id #')).not.toBeInTheDocument();
    });

    it('should not pass the requestId if it is not a valid number', () => {
      errorCode = 400;
      requestId = 'notNumber';
      renderConnectedContainer(<GeneralError />, () => state, 'BrowserRouter');
      expect(screen.getByText('400')).toBeInTheDocument();
      expect(screen.getByText('Bad Request')).toBeInTheDocument();
      expect(screen.getByText('The request could not be processed.')).toBeInTheDocument();
      expect(screen.queryByText('Request id #')).not.toBeInTheDocument();
    });
  });
});
