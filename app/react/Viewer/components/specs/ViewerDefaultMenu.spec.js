import React from 'react';
import {shallow} from 'enzyme';

import {ViewerDefaultMenu} from 'app/Viewer/components/ViewerDefaultMenu';

describe('ViewerDefaultMenu', () => {
  let component;
  let props;

  let render = () => {
    component = shallow(<ViewerDefaultMenu {...props}/>);
  };

  it('should open viewReferencesPanel on click references button', () => {
    props = {
      openPanel: jasmine.createSpy('openPanel')
    };
    render();

    component.find('.view-references').simulate('click');
    expect(props.openPanel).toHaveBeenCalledWith('viewReferencesPanel');
  });

  it('should open viewMetadataPanel on click metadata button', () => {
    props = {
      openPanel: jasmine.createSpy('openPanel')
    };
    render();

    component.find('.view-metadata').simulate('click');
    expect(props.openPanel).toHaveBeenCalledWith('viewMetadataPanel');
  });
});
