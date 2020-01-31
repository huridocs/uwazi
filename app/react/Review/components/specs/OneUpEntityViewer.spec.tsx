/** @format */

import { ConnectionsList } from 'app/ConnectionsList';
import { shallow, ShallowWrapper } from 'enzyme';
import Immutable from 'immutable';
import React from 'react';
import { OneUpState } from '../../common';
import {
  OneUpEntityViewerBase,
  OneUpEntityViewerProps,
  OneUpEntityViewerState,
} from '../OneUpEntityViewer';

describe('EntityViewer', () => {
  let component: ShallowWrapper<
    OneUpEntityViewerProps,
    OneUpEntityViewerState,
    OneUpEntityViewerBase
  >;
  let props: OneUpEntityViewerProps;
  let context: any;

  beforeEach(() => {
    context = { confirm: jasmine.createSpy('confirm') };
    props = {
      entity: { title: 'Title' },
      templates: Immutable.fromJS([
        {
          _id: 'template1',
          properties: [{ name: 'source_property', label: 'label1' }],
          name: 'template1Name',
        },
        {
          _id: 'template2',
          properties: [{ name: 'source_property', label: 'label2' }],
          name: 'template2Name',
        },
      ]),
      relationships: Immutable.fromJS([]),
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
      oneUpState: {} as OneUpState,
      deleteConnection: jasmine.createSpy('deleteConnection'),
      showTab: jasmine.createSpy('showTab'),
      connectionsChanged: jasmine.createSpy('connectionsChanged'),
      switchOneUpEntity: jasmine.createSpy('switchOneUpEntity'),
      toggleOneUpFullEdit: jasmine.createSpy('toggleOneUpFullEdit'),
      toggleOneUpLoadConnections: jasmine.createSpy('toggleOneUpLoadConnections'),
      mlThesauri: [],
    };
  });

  const render = () => {
    component = shallow(<OneUpEntityViewerBase {...props} />, { context });
  };

  it('should render', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render the ConnectionsList passing deleteConnection as prop', () => {
    render();

    component
      .find(ConnectionsList)
      .props()
      .deleteConnection({ sourceType: 'not metadata' });
    expect(context.confirm).toHaveBeenCalled();
  });

  describe('deleteConnection', () => {
    beforeEach(() => {
      render();
    });

    it('should confirm deleting a Reference', () => {
      component.instance().deleteConnection({});
      expect(context.confirm).toHaveBeenCalled();
      expect(props.deleteConnection).not.toHaveBeenCalled();
    });

    it('should delete the reference upon accepting', () => {
      const ref = { _id: 'r1' };
      component.instance().deleteConnection(ref);
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteConnection).toHaveBeenCalledWith(ref);
    });

    it('should not atempt to delete references whos source is metadata', () => {
      const ref = { _id: 'r1', sourceType: 'metadata' };
      component.instance().deleteConnection(ref);
      expect(context.confirm).not.toHaveBeenCalled();
      expect(props.deleteConnection).not.toHaveBeenCalled();
    });
  });

  describe('closing side panel', () => {
    beforeEach(() => {
      render();
      component.find('.closeSidepanel').simulate('click');
      component.update();
    });
    it('should close the side panel when close button is clicked', () => {
      expect(component.find('.entity-info').prop('open')).toBe(false);
      expect(component.find('.entity-connections').prop('open')).toBe(false);
      expect(component.find('.show-info-sidepanel-context-menu').prop('show')).toBe(true);
    });
    it('should reveal side panel when context menu is clicked', () => {
      expect(component.find('.entity-info').prop('open')).toBe(false);

      (component.find('.show-info-sidepanel-menu').prop('openPanel') as () => {})();
      component.update();

      expect(component.find('.entity-info').prop('open')).toBe(true);
      expect(component.find('.show-info-sidepanel-context-menu').prop('show')).toBe(false);
    });
  });
});
