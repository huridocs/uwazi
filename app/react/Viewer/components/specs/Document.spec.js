import React from 'react';
import {shallow} from 'enzyme';

import Text from 'app/Viewer/utils/Text';
import {Document} from 'app/Viewer/components/Document.js';

describe('Document', () => {
  let component;
  let instance;

  let document = {
    _id: 'documentId',
    pages: ['page1', 'page2', 'page3'],
    css: ['css1', 'css2']
  };

  let props;

  beforeEach(() => {
    props = {
      setSelection: jasmine.createSpy('setSelection'),
      unsetSelection: jasmine.createSpy('unsetSelection'),
      resetDocumentViewer: jasmine.createSpy('resetDocumentViewer')
    };
  });

  let render = () => {
    component = shallow(<Document {...props} document={document}/>);
    instance = component.instance();
  };

  it('should render every pagen inside a div ', () => {
    render();
    let pages = component.find('.document-viewer').children();
    expect(pages.first().props().dangerouslySetInnerHTML).toEqual({__html: 'page1'});
    expect(pages.last().props().dangerouslySetInnerHTML).toEqual({__html: 'page3'});
  });

  it('should render every css inside a style ', () => {
    render();
    let styles = component.find('style');

    expect(styles.first().props()).toEqual({type: 'text/css', dangerouslySetInnerHTML: Object({__html: 'css1'})});
    expect(styles.last().props()).toEqual({type: 'text/css', dangerouslySetInnerHTML: Object({__html: 'css2'})});
  });

  describe('componentDidMount', () => {
    it('should instantiate a Text object with pageContainer', () => {
      render();
      instance.componentDidMount();
      expect(instance.text.container).toBe(instance.pagesContainer);
    });
  });

  describe('when a panel is open', () => {
    it('should add class is-active to the viewer', () => {
      props.panelIsOpen = true;
      render();
      let viewer = component.find('.document-viewer');
      expect(viewer.hasClass('is-active')).toBe(true);
    });
  });

  describe('componentWillUnmount', () => {
    it('should resetDocumentViewer', () => {
      render();
      component.unmount();
      expect(props.resetDocumentViewer).toHaveBeenCalled();
    });
  });

  describe('onMouseUp/onTouchEnd', () => {
    beforeEach(() => {
      render();
      instance.text = Text(instance.pagesContainer);
    });

    describe('when text selected', () => {
      it('should call onTextSelected', () => {
        spyOn(instance, 'onTextSelected');
        spyOn(instance.text, 'selected').and.returnValue(true);

        component.find('.document-viewer').simulate('mouseup');
        expect(instance.onTextSelected).toHaveBeenCalled();

        instance.onTextSelected.calls.reset();
        component.find('.document-viewer').simulate('touchend');
        expect(instance.onTextSelected).toHaveBeenCalled();
      });
    });

    describe('when no text selected', () => {
      it('should unsetSelection', () => {
        spyOn(instance.text, 'selected').and.returnValue(false);

        component.find('.document-viewer').simulate('mouseup');

        expect(props.unsetSelection).toHaveBeenCalled();
      });

      it('should not call onTextSelected', () => {
        spyOn(instance, 'onTextSelected');
        spyOn(instance.text, 'selected').and.returnValue(false);

        component.find('.document-viewer').simulate('mouseup');
        expect(instance.onTextSelected).not.toHaveBeenCalled();

        instance.onTextSelected.calls.reset();
        component.find('.document-viewer').simulate('touchend');
        expect(instance.onTextSelected).not.toHaveBeenCalled();
      });
    });
  });

  describe('onTextSelected', () => {
    beforeEach(() => {
      props.selection = {selection: 'selection'};
      render();
      instance.text = Text(instance.pagesContainer);
      spyOn(instance.text, 'getSelection').and.returnValue('serializedRange');
    });

    it('should setSelection() with the range serialized', () => {
      instance.onTextSelected();
      expect(props.setSelection).toHaveBeenCalledWith('serializedRange');
    });
  });

  describe('componentDidUpdate', () => {
    it('should simulateSelection', () => {
      spyOn(instance.text, 'simulateSelection');
      instance.componentDidUpdate();

      expect(instance.text.simulateSelection).toHaveBeenCalledWith({selection: 'selection'});
    });
  });
});
