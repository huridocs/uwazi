import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import GeneralError from 'app/App/ErrorHandling/GeneralError';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';

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

  describe('when a page could not be rendered at server', () => {
    let component: ShallowWrapper<typeof GeneralError>;
    const context = { store: { getState: () => ({}) }, router: { location: '' } };
    const render = () => {
      component = shallow(<GeneralError />, { context });
    };

    it('should show render an ErrorFallback with the error', () => {
      requestId = '1234';
      render();
      expect(component.find(ErrorFallback).at(0).props()).toEqual({
        error: {
          title: 'Unexpected error',
          summary: 'Unexpected error',
          name: '',
          message: '',
          code: '500',
          requestId: '1234',
        },
      });
    });

    it('should pass a 404 code if received code is not supported', () => {
      errorCode = 422;
      requestId = '1234';
      render();
      expect(component.find(ErrorFallback).at(0).props()).toEqual({
        error: {
          title: 'Not Found',
          name: "We can't find the page you're looking for.",
          message: '',
          summary: '',
          code: '404',
          requestId: '1234',
        },
      });
    });

    it('should not pass the requestId if it is not a valid number', () => {
      errorCode = 400;
      requestId = 'notNumber';
      render();
      expect(component.find(ErrorFallback).at(0).props()).toEqual({
        error: {
          title: 'Bad Request',
          summary: 'Bad Request',
          name: 'The request could not be processed.',
          message: '',
          code: '400',
          requestId: undefined,
        },
      });
    });
  });
});
