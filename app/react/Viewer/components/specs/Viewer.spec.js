import { fromJS as Immutable } from 'immutable';
import React from 'react';

import { CreateConnectionPanel } from 'app/Connections';
import { Viewer } from 'app/Viewer/components/Viewer';
import { shallow } from 'enzyme';
import ContextMenu from 'app/ContextMenu';
import ShowIf from 'app/App/ShowIf';
import SourceDocument from 'app/Viewer/components/SourceDocument';
import TargetDocument from 'app/Viewer/components/TargetDocument';

describe('Viewer', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      doc: Immutable({ _id: 'id', sharedId: 'sharedId' }),
      targetDoc: false,
      addReference: () => {},
      loadTargetDocument: () => {},
      location: { query: {} },
    };
  });

  const render = () => {
    context = { store: { dispatch: jasmine.createSpy('dispatch') } };
    component = shallow(<Viewer {...props}/>, { context, disableLifecycleMethods: true });
  };

  it('should add "connections" className when showConnections', () => {
    props.showConnections = true;
    render();
    expect(component.find('.document-viewer').hasClass('connections')).toBe(true);
  });

  it('should add with-panel className when there is a panel open', () => {
    props.panelIsOpen = true;
    render();
    expect(component.find('.document-viewer').hasClass('with-panel')).toBe(true);
  });

  it('should add show-target-document className when targetDocument loaded', () => {
    props.panelIsOpen = true;
    props.targetDoc = true;
    render();
    expect(component.find('.document-viewer').hasClass('show-target-document')).toBe(true);
  });

  it('should not render SourceDocument when targetDocument loaded', () => {
    props.targetDoc = true;
    render();
    component.instance().componentDidMount();
    component.update();
    expect(component.find(SourceDocument).parent(ShowIf).props().if).toBe(false);
  });

  it('should render Document after component did mount', () => {
    props.panelIsOpen = true;
    props.showTextSelectMenu = false;

    render();
    component.instance().componentDidMount();
    component.update();

    expect(component.find(ContextMenu).length).toBe(2);
    expect(component.find(SourceDocument).length).toBe(1);
    expect(component.find(TargetDocument).length).toBe(1);

    expect(component.find(ContextMenu).at(0).props().overrideShow).toBe(true);
    expect(component.find(ContextMenu).at(1).props().overrideShow).toBe(true);

    expect(component.find(ContextMenu).at(0).props().show).toBe(false);
    expect(component.find(ContextMenu).at(1).props().show).toBe(false);

    props.panelIsOpen = false;
    props.showTextSelectMenu = true;

    render();

    expect(component.find(ContextMenu).at(0).props().show).toBe(true);
    expect(component.find(ContextMenu).at(1).props().show).toBe(true);
  });

  it('should render plain text always, if raw is false should render SourceDocument on update', () => {
    render();

    expect(component.find('pre').length).toBe(1);
    component.instance().componentDidMount();
    component.update();
    expect(component.find(SourceDocument).length).toBe(1);

    component.setProps({ raw: true });
    expect(component.find('pre').length).toBe(1);
  });

  describe('createConnectionPanel', () => {
    it('should include the create connections panel with correct props', () => {
      render();
      const createConnectionElement = component.find(CreateConnectionPanel).first();
      expect(component.find(CreateConnectionPanel).length).toBe(1);
      expect(createConnectionElement.props().containerId).toBe('sharedId');
      expect(createConnectionElement.props().onCreate).toBe(props.addReference);
      expect(createConnectionElement.props().onRangedConnect).toBe(props.loadTargetDocument);
    });

    it('should mark "target" as containerId if targetDocument', () => {
      props.targetDoc = true;
      render();
      const createConnectionElement = component.find(CreateConnectionPanel).first();
      expect(component.find(CreateConnectionPanel).length).toBe(1);
      expect(createConnectionElement.props().containerId).toBe('target');
    });
  });

  describe('on mount', () => {
    it('should loadDefaultViewerMenu()', () => {
      render();
      component.instance().componentDidMount();
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'LOAD_DEFAULT_VIEWER_MENU' });
    });
  });
});
