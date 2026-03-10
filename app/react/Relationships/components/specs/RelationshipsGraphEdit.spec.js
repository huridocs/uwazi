import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';

import { RelationshipsGraphEdit } from '../RelationshipsGraphEdit';
import LeftRelationship from '../LeftRelationship';
import RightRelationship from '../RightRelationship';

describe('RelationshipsGraphEdit', () => {
  let component;
  let props;
  let hubs;

  beforeEach(() => {
    hubs = [
      {
        hub: '1',
        leftRelationship: { entity: 'sharedId1', hub: 1, template: '123' },
        rightRelationships: [
          {
            template: null,
            relationships: [
              { entity: 'sharedId2', hub: 1, template: null },
              { entity: 'sharedId3', hub: 1, template: null },
            ],
          },
          {
            template: '456',
            relationships: [
              { entity: 'sharedId2', hub: 1, template: '456' },
              { entity: 'sharedId3', hub: 1, template: '456' },
            ],
          },
        ],
      },
      {
        hub: '2',
        leftRelationship: { entity: 'sharedId1', hub: '2', template: '123' },
        rightRelationships: [
          {
            template: '789',
            relationships: [
              { entity: 'sharedId2', hub: '2', template: '789' },
              { entity: 'sharedId4', hub: '2', template: '789' },
            ],
          },
        ],
      },
    ];

    props = {
      parentEntity: fromJS({}),
      hubs: fromJS(hubs),
      editing: false,
      searchResults: fromJS({ rows: [] }),
      parseResults: jasmine.createSpy('parseResults'),
      addHub: jasmine.createSpy('addHub'),
    };
  });

  const render = () => {
    component = shallow(<RelationshipsGraphEdit {...props} />);
  };

  it('should render a LeftRelationship component for each hub', () => {
    render();
    const leftRelationshipComponents = component.find(LeftRelationship);
    expect(leftRelationshipComponents.length).toBe(2);
    expect(leftRelationshipComponents.at(0).props().index).toBe(0);
    expect(leftRelationshipComponents.at(0).props().hub).toEqual(fromJS(hubs[0]));
    expect(leftRelationshipComponents.at(1).props().hub).toEqual(fromJS(hubs[1]));
  });

  it('should render a RightRelationship component for each hub', () => {
    render();
    const rightRelationshipComponents = component.find(RightRelationship);
    expect(rightRelationshipComponents.length).toBe(2);
    expect(rightRelationshipComponents.at(0).props().index).toBe(0);
    expect(rightRelationshipComponents.at(0).props().hub).toEqual(fromJS(hubs[0]));
    expect(rightRelationshipComponents.at(1).props().hub).toEqual(fromJS(hubs[1]));
  });

  describe('when editing', () => {
    it('should render a buttong to add a hub', () => {
      props.editing = true;
      render();
      component.find('.relationships-new').simulate('click');
      expect(props.addHub).toHaveBeenCalled();
    });
  });

  describe('componentDidMount', () => {
    it('should call parseResults', () => {
      render();
      const instance = component.instance();
      instance.componentDidMount();
      expect(props.parseResults).toHaveBeenCalledWith(
        props.searchResults,
        props.parentEntity,
        props.editing
      );
    });
  });

  describe('componentDidUpdate', () => {
    it('should call parseResults when searchResults changed', () => {
      render();
      const instance = component.instance();
      props.parseResults.calls.reset();
      instance.componentDidUpdate(props);
      expect(props.parseResults).not.toHaveBeenCalled();
      props.searchResults = fromJS({ rows: [] });
      instance.componentDidUpdate(props);
      expect(props.parseResults).toHaveBeenCalledWith(
        props.searchResults,
        props.parentEntity,
        props.editing
      );
    });
  });
});
