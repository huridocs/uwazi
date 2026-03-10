import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';
import Doc from 'app/Library/components/Doc';
import DropdownList from 'react-widgets/lib/DropdownList';

import { LeftRelationship } from '../LeftRelationship';
import HubRelationshipMetadata from '../HubRelationshipMetadata';

describe('RelationshipsGraphEdit', () => {
  let component;
  let props;
  let hub;

  beforeEach(() => {
    hub = {
      hub: '1',
      leftRelationship: {
        entity: 'sharedId1',
        hub: 1,
        template: '123',
        entityData: { sharedId: 'sharedId1' },
      },
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
      search: { sort: 'creationDate', order: 'desc', treatAs: 'number' },
      relationTypes: [{ _id: '123', name: 'Friend' }],
      parentEntity: fromJS({ sharedId: 'sharedId1' }),
      hub: fromJS(hub),
      editing: false,
      updateLeftRelationshipType: jasmine.createSpy('updateLeftRelationshipType'),
      toggelRemoveLeftRelationship: jasmine.createSpy('toggelRemoveLeftRelationship'),
      selectConnection: jasmine.createSpy('selectConnection'),
    };
  });

  const render = () => {
    component = shallow(<LeftRelationship {...props} />);
  };

  describe('render()', () => {
    beforeEach(render);

    it('should render the relationship', () => {
      expect(component.find(Doc).props().doc).toEqual(fromJS(props.parentEntity));
      expect(component.find(HubRelationshipMetadata).props().relationship).toEqual(
        fromJS(hub.leftRelationship)
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

  describe('while editing', () => {
    beforeEach(() => {
      props.editing = true;
      render();
    });

    describe('changing the template of a group', () => {
      it('should call updateLeftRelationshipType', () => {
        component.find(DropdownList).at(0).simulate('change', { _id: 3 });
        expect(props.updateLeftRelationshipType).toHaveBeenCalledWith(0, { _id: 3 });
      });
    });
  });

  describe('when relationship is text range reference', () => {
    it('should render the Doc with the target reference', () => {
      hub.leftRelationship.range = { start: 100, end: 200 };
      props.hub = fromJS(hub);
      render();
      expect(component).toMatchSnapshot();
    });
  });
});
