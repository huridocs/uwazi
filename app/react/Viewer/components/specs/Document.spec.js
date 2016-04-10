import React from 'react';
import {shallow} from 'enzyme';
import TextRange from 'batarange';

import mockRangeSelection from 'app/utils/mockRangeSelection';
import {Document} from 'app/Viewer/components/Document.js';

describe('Document', () => {
  let component;
  let instance;

  let document = {
    _id: 'documentId',
    pages: ['page1', 'page2', 'page3'],
    css: ['css1', 'css2']
  };

  let props = {
    setSelection: jasmine.createSpy('setSelection'),
    unsetSelection: jasmine.createSpy('unsetSelection'),
    resetDocumentViewer: jasmine.createSpy('resetDocumentViewer')
  };

  beforeEach(() => {
    component = shallow(<Document {...props} document={document}/>);
    instance = component.instance();
  });

  it('should render every pagen inside a div ', () => {
    let pages = component.find('.document-viewer').children();
    expect(pages.first().props().dangerouslySetInnerHTML).toEqual({__html: 'page1'});
    expect(pages.last().props().dangerouslySetInnerHTML).toEqual({__html: 'page3'});
  });

  it('should render every css inside a style ', () => {
    let styles = component.find('style');

    expect(styles.first().props()).toEqual({type: 'text/css', dangerouslySetInnerHTML: Object({__html: 'css1'})});
    expect(styles.last().props()).toEqual({type: 'text/css', dangerouslySetInnerHTML: Object({__html: 'css2'})});
  });

  describe('componentWillUnmount', () => {
    it('should resetDocumentViewer', () => {
      component.unmount();
      expect(props.resetDocumentViewer).toHaveBeenCalled();
    });
  });

  describe('onMouseUp/onTouchEnd', () => {
    describe('when text selected', () => {
      it('should call onTextSelected', () => {
        spyOn(instance, 'onTextSelected');

        mockRangeSelection('selection');

        component.find('.document-viewer').simulate('mouseup');
        expect(instance.onTextSelected).toHaveBeenCalled();

        instance.onTextSelected.calls.reset();
        component.find('.document-viewer').simulate('touchend');
        expect(instance.onTextSelected).toHaveBeenCalled();
      });
    });

    describe('when no text selected', () => {
      it('should unsetSelection', () => {
        mockRangeSelection('');
        component.find('.document-viewer').simulate('mouseup');

        expect(props.unsetSelection).toHaveBeenCalled();
      });

      it('should not call onTextSelected', () => {
        spyOn(instance, 'onTextSelected');

        mockRangeSelection('');

        component.find('.document-viewer').simulate('mouseup');
        expect(instance.onTextSelected).not.toHaveBeenCalled();

        instance.onTextSelected.calls.reset();
        component.find('.document-viewer').simulate('touchend');
        expect(instance.onTextSelected).not.toHaveBeenCalled();
      });
    });
  });

  describe('onTextSelected', () => {
    let range;
    beforeEach(() => {
      spyOn(TextRange, 'serialize').and.returnValue('serializedRange');
      range = mockRangeSelection('text');
    });

    it('should setSelection() with the range serialized', () => {
      instance.onTextSelected();
      expect(TextRange.serialize).toHaveBeenCalledWith(range, instance.pagesContainer);
      expect(props.setSelection).toHaveBeenCalledWith('serializedRange');
    });
  });
});
