import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';
import api from 'app/utils/api';
import { ConfirmButton } from 'app/Layout';

import { CustomUploads, mapStateToProps } from '../CustomUploads';

describe('CustomUploads', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    spyOn(api, 'get').and.returnValue(Promise.resolve({ json: 'uploads' }));
    props = {
      upload: jasmine.createSpy('upload'),
      deleteCustomUpload: jasmine.createSpy('deleteCustomUpload'),
      customUploads: Immutable.fromJS([]),
    };
  });

  const render = () => {
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = shallow(<CustomUploads {...props} />, { context });
  };

  it('should render CustomUploads component with uploaded files', () => {
    props.customUploads = Immutable.fromJS([{ filename: 'file1' }, { filename: 'file2' }]);
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

  describe('deleteCustomUpload', () => {
    it('should call deleteCustomUpload on click', () => {
      props.customUploads = Immutable.fromJS([{ _id: 'upload', filename: 'name' }]);
      render();

      component
        .find(ConfirmButton)
        .props()
        .action();

      expect(props.deleteCustomUpload).toHaveBeenCalledWith('upload');
    });
  });

  describe('mapStateToProps', () => {
    it('should map current progress and files to props', () => {
      const state = {
        customUploads: 'customUploads',
        progress: Immutable.fromJS({}),
      };

      props = mapStateToProps(state);
      expect(props.customUploads).toBe('customUploads');
      expect(props.progress).toBe(false);

      state.progress = Immutable.fromJS({
        customUpload_unique_id: 1,
        customUpload_unique_id2: 100,
      });
      props = mapStateToProps(state);
      expect(props.progress).toBe(true);

      state.progress = Immutable.fromJS({ not_custom_upload: 9 });
      props = mapStateToProps(state);
      expect(props.progress).toBe(false);
    });
  });

  describe('requestState', () => {
    it('should get the uploads', async () => {
      const request = {};
      const actions = await CustomUploads.requestState(request);

      expect(api.get).toHaveBeenCalledWith('customisation/upload', request);
      expect(actions).toMatchSnapshot();
    });
  });
});
