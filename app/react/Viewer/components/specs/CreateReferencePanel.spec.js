import React from 'react';
import {shallow} from 'enzyme';

import {CreateReferencePanel} from 'app/Viewer/components/CreateReferencePanel';
import SidePanel from 'app/Layout/SidePanel';

describe('CreateReferencePanel', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      results: []
    };
  });

  let render = () => {
    component = shallow(<CreateReferencePanel {...props}/>);
  };

  it('should render a SidePanel', () => {
    render();

    expect(component.find(SidePanel).length).toBe(1);
    expect(component.find(SidePanel).props().open).toBeUndefined();
  });

  describe('when props.referencePanel', () => {
    it('should open SidePanel', () => {
      props.referencePanel = true;
      render();

      expect(component.find(SidePanel).props().open).toBe(true);
    });
  });
});
