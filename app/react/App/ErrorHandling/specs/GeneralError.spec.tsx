import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import GeneralError from 'app/App/ErrorHandling/GeneralError';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';

describe('General Error', () => {
  describe('when a page could not be rendered at server', () => {
    let component: ShallowWrapper<typeof GeneralError>;
    const context = { store: { getState: () => ({}) }, router: { location: '' } };
    const render = (errorCode = 500, requestId = '1234') => {
      const props = {
        params: {
          errorCode,
        },
        location: {
          query: {
            requestId,
          },
        },
      };
      component = shallow(<GeneralError {...props} />, { context });
    };

    it('should show render an ErrorFallback with the error', () => {
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
      render(422);
      expect(component.find(ErrorFallback).at(0).props()).toEqual({
        error: {
          title: 'Not Found',
          name: 'We can’t find the page you’re looking for. ',
          message: '',
          summary: '',
          code: '404',
          requestId: '1234',
        },
      });
    });

    it('should not pass the requestId if it is not a valid number', () => {
      render(400, 'notNumber');
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
