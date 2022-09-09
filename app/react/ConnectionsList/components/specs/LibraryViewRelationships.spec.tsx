import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { fromJS as Immutable } from 'immutable';
import { Collapsible } from 'app/App/Collapsible';
import { LibraryViewRelationshipsComp } from '../LibraryViewRelationships';

describe('LibraryViewRelationships', () => {
  let component: ShallowWrapper;
  let props: any;
  const entityData = {
    _id: 'entityid',
    title: 'Some entity title',
    sharedId: 'entitysharedid',
  };

  beforeEach(() => {
    props = {
      expanded: false,
      parentEntity: Immutable({}),
      searchResults: Immutable({}),
      search: { order: 'desc', sort: 'creationDate', treatAs: 'number' },
      hubs: Immutable([
        {
          hub: 'hubid',
          leftRelationship: { template: 'tempId', hub: 'hubid', entity: 'entityid', entityData },
          rightRelationships: [
            {
              template: 'tempId',
              relationships: [
                {
                  entityData,
                  _id: 'rightrelationshipsid',
                  entity: entityData._id,
                  hub: 'hubid',
                  template: 'tempId',
                },
              ],
            },
          ],
        },
      ]),
      parseResults: () => {},
      relationTypes: [{ name: 'Some name', _id: 'tempId' }],
      selectConnection: () => {},
    };
  });

  const render = (innerProps = props) => {
    component = shallow(<LibraryViewRelationshipsComp {...innerProps} />);
  };

  it('should show labels if available', () => {
    render();
    expect(component.find('.sidepanel-relationship-left-label').text()).toEqual('Some name');
  });

  it('should render right relationships as collapsibles', () => {
    render();
    const collapsibleProps = component.find(Collapsible).props();
    expect(collapsibleProps.header).toEqual('Some name');
    expect(collapsibleProps.headerInfo).toEqual('(1)');
    expect(collapsibleProps.collapse).toEqual(true);
  });

  it('should not show labels if none is available', () => {
    const customProps = {
      ...props,
      hubs: Immutable([
        {
          hub: 'hubid',
          leftRelationship: { template: null, hub: 'hubid', entity: 'entityid', entityData },
          rightRelationships: [
            {
              template: 'tempId',
              relationships: [
                {
                  entityData,
                  _id: 'rightrelationshipsid',
                  entity: entityData._id,
                  hub: 'hubid',
                  template: 'tempId',
                },
              ],
            },
          ],
        },
      ]),
    };
    render(customProps);
    expect(component.find('.sidepanel-relationship-left-label').exists()).toEqual(false);
  });
});
