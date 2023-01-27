/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { screen, fireEvent } from '@testing-library/react';

import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { renderConnectedContainer, defaultState } from 'app/utils/test/renderConnected';
import { CustomUploadsComponent as CustomUploads, mapStateToProps } from '../CustomUploads';

describe('CustomUploads', () => {
  let props;
  let renderResult;

  beforeEach(() => {
    spyOn(api, 'get').and.callFake(async () => Promise.resolve({ json: 'uploads' }));
    props = {
      customUploads: Immutable.fromJS([]),
      deleteCustomUpload: jasmine.createSpy('deleteCustomUpload'),
      upload: jasmine.createSpy('upload'),
      params: { lang: 'es' },
    };
  });

  const render = () => {
    const reduxStore = {
      ...defaultState,
    };

    ({ renderResult } = renderConnectedContainer(<CustomUploads {...props} />, () => reduxStore));
  };

  it('should render CustomUploads component with uploaded files', () => {
    props.customUploads = Immutable.fromJS([{ filename: 'file1' }, { filename: 'file2' }]);
    render();
    expect(renderResult).toMatchSnapshot();
  });

  describe('when upload on progress', () => {
    it('should render on progress feedback', () => {
      props.progress = true;
      render();
      expect(renderResult).toMatchSnapshot();
    });
  });

  describe('deleteCustomUpload', () => {
    it('should call deleteCustomUpload on click', () => {
      props.customUploads = Immutable.fromJS([{ _id: 'upload', filename: 'name' }]);
      render();
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
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
      const request = new RequestParams();
      const actions = await CustomUploads.requestState(request);

      const expectedParams = new RequestParams({ type: 'custom' });
      expect(api.get).toHaveBeenCalledWith('files', expectedParams);
      expect(actions).toMatchSnapshot();
    });
  });
});
