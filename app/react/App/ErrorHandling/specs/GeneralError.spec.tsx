import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import GeneralError from 'app/App/ErrorHandling/GeneralError';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';

describe('General Error', () => {
  describe('when a page could not be rendered at server', () => {
    let component: ShallowWrapper<typeof GeneralError>;

    beforeAll(() => {
      const context = { store: { getState: () => ({}) }, router: { location: '' } };
      const props = {
        params: {
          errorCode: 500,
        },
        location: {
          query: {
            requestId: 1234,
          },
        },
      };
      component = shallow(<GeneralError {...props} />, { context });
    });

    it('should show render an ErrorBoundary with the error', () => {
      expect(
        component
          .find(ErrorFallback)
          .at(0)
          .props()
      ).toEqual({
        error: {
          message: '',
          name: 'Error 500. Unexpected error',
          title: 'Unexpected error',
        },
      });
    });

    it('should show the request Id if it is defined', () => {
      expect(
        component
          .find('span')
          .at(0)
          .text()
      ).toEqual('Request id #1234');
    });
  });
});
