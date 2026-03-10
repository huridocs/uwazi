import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';
import Doc from 'app/Library/components/Doc';
import DropdownList from 'react-widgets/lib/DropdownList';

import { RightRelationship } from '../RightRelationship';
import HubRelationshipMetadata from '../HubRelationshipMetadata';

describe('RelationshipsGraphEdit', () => {
  let component;
  let props;
  let hub;

  beforeEach(() => {
    hub = {
      hub: '1',
      leftRelationship: { entity: 'sharedId1', hub: 1, template: '123' },
      rightRelationships: [
        {
          template: null,
          relationships: [
            { entity: 'sharedId2', hub: 1, template: null, entityData: { sharedId: 'sharedId2' } },
            { entity: 'sharedId4', hub: 1, template: null, entityData: { sharedId: 'sharedId4' } },
          ],
        },
        {
          template: '456',
          relationships: [
            { entity: 'sharedId2', hub: 1, template: '456', entityData: { sharedId: 'sharedId2' } },
            { entity: 'sharedId3', hub: 1, template: '456', entityData: { sharedId: 'sharedId3' } },
          ],
        },
      ],
    };

    props = {
      index: 0,
      hubActions: fromJS({ editing: false }),
      search: { sort: 'creationDate', order: 'desc', treatAs: 'number' },
      relationTypes: [{ _id: '123', name: 'Friend' }],
      parentEntity: fromJS({}),
      hub: fromJS(hub),
      editing: false,
      searchResults: fromJS({ rows: [] }),
      updateRightRelationshipType: jasmine.createSpy('updateRightRelationshipType'),
      toggleRemoveRightRelationshipGroup: jasmine.createSpy('toggleRemoveRightRelationshipGroup'),
      toggleMoveEntity: jasmine.createSpy('toggleMoveEntity'),
      setAddToData: jasmine.createSpy('setAddToData'),
      toggleRemoveEntity: jasmine.createSpy('toggleRemoveEntity'),
      moveEntities: jasmine.createSpy('moveEntities'),
      openAddEntitiesPanel: jasmine.createSpy('openAddEntitiesPanel'),
      selectConnection: jasmine.createSpy('selectConnection'),
    };
  });

  const render = () => {
    component = shallow(<RightRelationship {...props} />);
  };

  describe('render()', () => {
    beforeEach(render);

    it('should render the relationship groups', () => {
      expect(component.find('.rightRelationshipsTypeGroup').length).toBe(2);
      expect(component.find(Doc).length).toBe(4);
      expect(component.find(Doc).at(0).props().doc).toEqual(
        fromJS(hub.rightRelationships[0].relationships[0].entityData)
      );
      expect(component.find(HubRelationshipMetadata).length).toBe(4);
      expect(component.find(HubRelationshipMetadata).at(0).props().relationship).toEqual(
        fromJS(hub.rightRelationships[0].relationships[0])
      );
    });
  });

  describe('clicking in a relationship', () => {
    it('should select that connection', () => {
      render();
      component.find(Doc).at(0).simulate('click');
      expect(props.selectConnection).toHaveBeenCalled();
    });
  });

  describe('when relationships have text references with ranges', () => {
    it('should render the Docs with the target text reference', () => {
      hub.rightRelationships[0].relationships[0].reference = {
        text: 'Hu ha!',
        selectionRectangles: [],
      };
      hub.rightRelationships[1].relationships[1].reference = {
        text: ':D',
        selectionRectangles: [],
      };
      props.hub = fromJS(hub);
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('while editing', () => {
    beforeEach(() => {
      props.hubActions = fromJS({ editing: true });
      render();
    });

    describe('clicking on the delete button next to a relationship', () => {
      it('should mark that relationship to be deleted', () => {
        component.find('.removeEntity button').at(0).simulate('click');
        expect(props.toggleRemoveEntity).toHaveBeenCalledWith(0, 0, 0);
      });
    });

    describe('clicking on the delete button next to a right group', () => {
      it('should mark that entire gtoup to be deleted', () => {
        component.find('.removeRightRelationshipGroup button').at(0).simulate('click');
        expect(props.toggleRemoveRightRelationshipGroup).toHaveBeenCalledWith(0, 0);
      });
    });

    describe('clicking on the add new relationship', () => {
      it('should call setAddToData and openAddEntitiesPanel', () => {
        component.find('.relationships-new').at(0).simulate('click');
        expect(props.setAddToData).toHaveBeenCalledWith(0, 0);
        expect(props.openAddEntitiesPanel).toHaveBeenCalled();
      });
    });

    describe('changing the template of a group', () => {
      it('should call updateRightRelationshipType', () => {
        component.find(DropdownList).at(0).simulate('change', { _id: 3 });
        expect(props.updateRightRelationshipType).toHaveBeenCalledWith(0, 0, 3);
      });
    });
  });
});
