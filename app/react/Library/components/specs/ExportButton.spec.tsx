import React from 'react';
import { shallow } from 'enzyme';
import thunk from 'redux-thunk';

import ExportButton, { ExportButtonProps } from 'app/Library/components/ExportButton';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import Immutable from 'immutable';
import { Captcha } from 'app/Forms';
import * as actions from '../../actions/exportActions';

describe('ExportButton', () => {
  let component: any;
  let props: Pick<ExportButtonProps, 'storeKey'>;
  const mockStore = configureMockStore([thunk]);
  let store: any;

  const render = () => {
    component = shallow(
      <Provider store={store}>
        <ExportButton {...props} />
      </Provider>
    )
      .dive()
      .dive();
  };

  describe('when instantiated', () => {
    beforeEach(() => {
      props = {
        storeKey: 'library',
      };
      store = mockStore({
        exportSearchResults: { exportSearchResultsProcessing: Immutable.fromJS(false) },
        user: Immutable.fromJS({ id_: '1234' }),
      });
    });

    it('should not have the disabled class', () => {
      render();
      expect(component.find('.btn-disabled').length).toBe(0);
    });

    it('should dispatch exportDocuments on click', () => {
      spyOn(actions, 'exportDocuments').and.returnValue(() => {});
      render();

      component.find('.btn').simulate('click');

      expect(actions.exportDocuments).toHaveBeenCalledWith('library');
    });

    it('should have the custom class btn-export', () => {
      render();
      expect(component.find('.btn-export').length).toBe(1);
    });
  });

  describe('when processing', () => {
    beforeEach(() => {
      props = {
        storeKey: 'library',
      };
      store = mockStore({
        exportSearchResults: { exportSearchResultsProcessing: Immutable.fromJS(true) },
        user: Immutable.fromJS({}),
      });
    });

    it('should be disabled', () => {
      render();
      expect(component.find('.btn-disabled').length).toBe(1);
    });

    it('should not dispatch on click', () => {
      spyOn(actions, 'exportDocuments').and.returnValue(() => {});
      render();
      expect(actions.exportDocuments).not.toHaveBeenCalled();
    });

    fit('should ask for a captcha if there is no user in the store', () => {
      render();
      component.find('.btn').simulate('click');
      expect(component.contains(<Captcha onChange={() => {}} />)).toBe(true);
    });
  });
});
