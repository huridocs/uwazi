import { ConnectionsList } from 'app/ConnectionsList';
import { OneUpState } from 'app/istore';
import { shallow, ShallowWrapper } from 'enzyme';
import Immutable from 'immutable';
import React from 'react';
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

  beforeEach(() => {
    props = {
      entity: { title: 'Title', template: 'template1' },
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
      tab: 'info',
      oneUpState: { reviewThesaurusValues: ['foo'] } as OneUpState,
      deleteConnection: jasmine.createSpy('deleteConnection'),
      connectionsChanged: jasmine.createSpy('connectionsChanged'),
      toggleOneUpFullEdit: jasmine.createSpy('toggleOneUpFullEdit'),
      mlThesauri: [],
      mainContext: { confirm: jasmine.createSpy('confirm') },
    };
  });

  const render = () => {
    component = shallow(<OneUpEntityViewerBase {...props} />);
  };

  // Note: this component is mostly tested through nightmare/paths/review.spec.js

  it('nonMlProps', () => {
    render();
    expect(component.instance().nonMlProps()).toEqual(['source_property']);
  });

  it('should toggle full edit', () => {
    props.oneUpState.fullEdit = true;
    render();
    component.find('.content-header > .btn').simulate('click');
    expect(props.toggleOneUpFullEdit).toHaveBeenCalled();
  });

  it('should render the ConnectionsList passing deleteConnection as prop', () => {
    render();

    component.find(ConnectionsList).props().deleteConnection({ sourceType: 'not metadata' });
    expect(props.mainContext.confirm).toHaveBeenCalled();
  });

  describe('deleteConnection', () => {
    beforeEach(() => {
      render();
    });

    it('should confirm deleting a Reference', () => {
      component.instance().deleteConnection({});
      expect(props.mainContext.confirm).toHaveBeenCalled();
      expect(props.deleteConnection).not.toHaveBeenCalled();
    });

    it('should delete the reference upon accepting', () => {
      const ref = { _id: 'r1' };
      component.instance().deleteConnection(ref);
      //@ts-ignore
      props.mainContext.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteConnection).toHaveBeenCalledWith(ref);
    });

    it('should not atempt to delete references whos source is metadata', () => {
      const ref = { _id: 'r1', sourceType: 'metadata' };
      component.instance().deleteConnection(ref);
      expect(props.mainContext.confirm).not.toHaveBeenCalled();
      expect(props.deleteConnection).not.toHaveBeenCalled();
    });
  });
});
