import { OneUpState } from 'app/istore';
import { shallow, ShallowWrapper } from 'enzyme';
import Immutable from 'immutable';
import React from 'react';
import { Tabs } from 'react-tabs-redux';
import { OneUpSidePanelBase, OneUpSidePanelProps } from '../OneUpSidePanel';

describe('EntityViewer', () => {
  let component: ShallowWrapper<OneUpSidePanelProps, {}, OneUpSidePanelBase>;
  let props: OneUpSidePanelProps;

  beforeEach(() => {
    props = {
      entity: { title: 'Title', template: 'template1' },
      templates: Immutable.fromJS([
        {
          _id: 'template1',
          properties: [
            { name: 'source_property', label: 'label1' },
            { name: 'ml_property', content: 'mlThes' },
          ],
          name: 'template1Name',
        },
        {
          _id: 'template2',
          properties: [{ name: 'source_property', label: 'label2' }],
          name: 'template2Name',
        },
      ]),
      connectionsGroups: Immutable.fromJS([
        { key: 'g1', templates: [{ _id: 't1', count: 1 }] },
        {
          key: 'g2',
          templates: [
            { _id: 't2', count: 2 },
            { _id: 't3', count: 3 },
          ],
        },
      ]),
      selectedConnection: false,
      tab: 'info',
      panelOpen: true,
      oneUpState: {} as OneUpState,
      deleteConnection: jasmine.createSpy('deleteConnection'),
      closePanel: jasmine.createSpy('closePanel'),
      showTab: jasmine.createSpy('showTab'),
      connectionsChanged: jasmine.createSpy('connectionsChanged'),
      toggleOneUpLoadConnections: jasmine.createSpy('toggleOneUpLoadConnections'),
      mlThesauri: ['mlThes'],
    };
  });

  const render = () => {
    component = shallow(<OneUpSidePanelBase {...props} />);
  };

  it('mlProps', () => {
    render();
    expect(component.instance().mlProps()).toEqual(['ml_property']);
  });

  it('should render', () => {
    render();
    expect(component.find(Tabs).length).toBe(2);
  });

  it('should close the side panel when close button is clicked', () => {
    render();
    component.find('.closeSidepanel').simulate('click');
    component.update();
    expect(props.closePanel).toHaveBeenCalled();
  });
});
