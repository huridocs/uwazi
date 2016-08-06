import React from 'react';
import {shallow} from 'enzyme';

import SourceDocument from 'app/Viewer/components/SourceDocument';
import TargetDocument from 'app/Viewer/components/TargetDocument';
import ContextMenu from 'app/ContextMenu';
import {Viewer} from 'app/Viewer/components/Viewer';

describe('Viewer', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      setDefaultViewerMenu: jasmine.createSpy('setDefaultViewerMenu'),
      resetDocumentViewer: jasmine.createSpy('resetDocumentViewer')
    };
  });

  let render = () => {
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<Viewer {...props}/>, {context});
  };

  it('should add with-panel className when there is a panel open', () => {
    props.panelIsOpen = true;
    render();
    expect(component.find('.document-viewer').hasClass('with-panel')).toBe(true);
  });

  it('should add  show-target-document className when targetDocument loaded', () => {
    props.panelIsOpen = true;
    props.targetDoc = true;
    render();
    expect(component.find('.document-viewer').hasClass('show-target-document')).toBe(true);
  });

  it('should render Document and ContextMenu', () => {
    render();
    expect(component.find(SourceDocument).length).toBe(1);
    expect(component.find(TargetDocument).length).toBe(1);
    expect(component.find(ContextMenu).length).toBe(1);
  });

  describe('on mount', () => {
    it('should loadDefaultViewerMenu()', () => {
      render();
      component.instance().componentDidMount();
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'LOAD_DEFAULT_VIEWER_MENU'});
    });
  });
});
