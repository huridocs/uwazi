import React from 'react';
import {shallow} from 'enzyme';

import CreateReferencePanel from 'app/Viewer/components/CreateReferencePanel';

describe('CreateReferencePanel', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      results: []
    };
    component = shallow(<CreateReferencePanel {...props}/>);
  });

  // it('should render', () => {
  //   expect(true).toBe(false);
  // });
});
