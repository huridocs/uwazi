import React from 'react';
import {shallow} from 'enzyme';

import {UploadsSection} from 'app/Uploads/components/UploadsSection';

describe('UploadsSection', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {};
  });

  let render = () => {
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<UploadsSection {...props}/>, {context});
  };

  it('should add with-panel className when editing a document', () => {
    props.panelIsOpen = true;
    render();
    expect(component.find('.document-viewer').hasClass('with-panel')).toBe(true);
  });

  describe('on mount', () => {
    it('should loadDefaultViewerMenu()', () => {
      render();
      component.instance().componentDidMount();
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'ENTER_UPLOADS_SECTION'});
    });
  });

  //describe('componentWillUnmount', () => {
    //it('should resetDocumentViewer', () => {
      //render();
      //component.unmount();
      //expect(context.store.dispatch).toHaveBeenCalledWith({type: 'RESET_DOCUMENT_VIEWER'});
    //});
  //});
});
