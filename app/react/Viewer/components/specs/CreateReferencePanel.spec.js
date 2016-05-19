import React from 'react';
import Immutable from 'immutable';
import {shallow} from 'enzyme';

import {CreateReferencePanel} from 'app/Viewer/components/CreateReferencePanel';
import SidePanel from 'app/Layout/SidePanel';
import SearchResults from 'app/Viewer/components/SearchResults';

describe('CreateReferencePanel', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      results: Immutable.fromJS([])
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
      props.open = true;
      render();

      expect(component.find(SidePanel).props().open).toBe(true);
    });
  });

  it('should render SearchResults passing the results, searching flag and selected element', () => {
    props.results = Immutable.fromJS(['results']);
    props.searching = false;
    props.selected = 'selected';
    render();

    expect(component.find(SearchResults).props().results).toBe(props.results);
    expect(component.find(SearchResults).props().searching).toBe(props.searching);
    expect(component.find(SearchResults).props().selected).toBe(props.selected);
  });

  describe('onClick on a result', () => {
    it('should call props.selectTargetDocument', () => {
      props.selectTargetDocument = jasmine.createSpy('selectTargetDocument');
      render();

      component.find(SearchResults).simulate('click');
      expect(props.selectTargetDocument).toHaveBeenCalled();
    });
  });
});
