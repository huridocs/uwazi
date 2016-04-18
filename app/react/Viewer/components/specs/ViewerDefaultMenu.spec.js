import React from 'react';
import {shallow} from 'enzyme';

import {ViewerDefaultMenu} from 'app/Viewer/components/ViewerDefaultMenu';

describe('ViewerDefaultMenu', () => {
  let component;
  let props;

  let render = () => {
    component = shallow(<ViewerDefaultMenu {...props}/>);
  };

  it('should render a default button when reference its not complete', () => {
    props = {
      openPanel: jasmine.createSpy('openViewReferencesPanel')
    };
    render();

    component.find('.view-references').simulate('click');
    expect(props.openPanel).toHaveBeenCalledWith('viewReferencesPanel');
  });
});
