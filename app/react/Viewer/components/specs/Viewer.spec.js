import React from 'react';
import {shallow} from 'enzyme';

import Document from 'app/Viewer/components/Document';
import ContextMenu from 'app/ContextMenu/components/ContextMenu';
import Viewer from 'app/Viewer/components/Viewer';

describe('Viewer', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      setDefaultViewerMenu: jasmine.createSpy('setDefaultViewerMenu')
    };
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<Viewer {...props}/>, {context});
  });

  it('should render Document and ContextMenu', () => {
    expect(component.find(Document).length).toBe(1);
    expect(component.find(ContextMenu).length).toBe(1);
  });

  describe('on mount', () => {
    it('should loadDefaultViewerMenu()', () => {
      component.instance().componentDidMount();
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'LOAD_DEFAULT_VIEWER_MENU'});
    });
  });
});
