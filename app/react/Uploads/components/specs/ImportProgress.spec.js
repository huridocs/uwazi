import React from 'react';

import { ImportProgress } from 'app/Uploads/components/ImportProgress';
import { shallow } from 'enzyme';

describe('ImportProgress', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      importState: { importStart: true, importProgress: 5, importError: '', importEnd: false },
      close: jasmine.createSpy('close'),
    };
  });

  const render = () => {
    component = shallow(<ImportProgress {...props}/>);
  };

  describe('rendering states', () => {
    it('should render a state for normal progress', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    it('should render a state for errors', () => {
      props.importState.importError = 'Something bad happened';
      render();
      expect(component).toMatchSnapshot();
    });

    it('should render a state for end', () => {
      props.importState.importEnd = true;
      render();
      expect(component).toMatchSnapshot();
    });
  });
});
