import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';
import api from 'app/utils/api';

import { CustomUploads, mapStateToProps } from '../CustomUploads';

fdescribe('CustomUploads', () => {
  let component;
  let props;
  let context;
  let instance;

  beforeEach(() => {
    spyOn(api, 'get').and.returnValue(Promise.resolve({ json: 'uploads' }));
    props = {
      upload: jasmine.createSpy('upload'),
      customUploads: Immutable.fromJS([])
    };
  });

  const render = () => {
    context = { store: { dispatch: jasmine.createSpy('dispatch') } };
    component = shallow(<CustomUploads {...props}/>, { context });
    instance = component.instance();
  };

  it('should render CustomUploads component with uploaded files', () => {
    props.customUploads = Immutable.fromJS([
      { filename: 'file1' },
      { filename: 'file2' },
    ]);
    render();
    expect(component).toMatchSnapshot();
  });

  describe('when upload on progress', () => {
    it('should render on progress feedback', () => {
      props.progress = true;
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('mapStateToProps', () => {
    it('should map current progress and files to props', () => {
      const state = {
        customUploads: 'customUploads',
        progress: Immutable.fromJS({})
      };

      props = mapStateToProps(state);
      expect(props.customUploads).toBe('customUploads');
      expect(props.progress).toBe(false);

      state.progress = Immutable.fromJS({ customUpload_unique_id: 1, customUpload_unique_id2: 100 });
      props = mapStateToProps(state);
      expect(props.progress).toBe(true);

      state.progress = Immutable.fromJS({ not_custom_upload: 9 });
      props = mapStateToProps(state);
      expect(props.progress).toBe(false);
    });
  });

  describe('requestState', () => {
    it('should get the uploads', (done) => {
      render();
      CustomUploads.requestState()
      .then((state) => {
        expect(api.get).toHaveBeenCalledWith('customisation/upload');
        expect(state.customUploads).toEqual('uploads');
        done();
      });
    });
  });

  describe('setReduxState', () => {
    it('should set customUploads in state', () => {
      render();
      instance.setReduxState({ customUploads: 'customUploads' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'customUploads/SET', value: 'customUploads' });
    });
  });
});
