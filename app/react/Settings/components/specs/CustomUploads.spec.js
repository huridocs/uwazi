import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';

import { CustomUploads, mapStateToProps } from '../CustomUploads';

describe('CustomUploads', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      upload: jasmine.createSpy('upload')
    };
  });

  const render = () => {
    component = shallow(<CustomUploads {...props}/>);
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

      let props = mapStateToProps(state);
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
});
