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
    css: 'css'
  };

  let props;

  beforeEach(() => {
    props = {
      setSelection: jasmine.createSpy('setSelection'),
      unsetSelection: jasmine.createSpy('unsetSelection')
    };
  });

  let render = () => {
    component = shallow(<Document {...props} document={document}/>);
    instance = component.instance();
  };

  it('should add id as a className', () => {
    render();
    expect(component.find('div').children().first().hasClass('_documentId')).toBe(true);
  });

  it('should add the className passed', () => {
    props.className = 'aClass';
    render();
    expect(component.find('div').children().first().hasClass('aClass')).toBe(true);
  });

  it('should render every pagen inside a div ', () => {
    render();
    let pages = component.find('.document').children();
    expect(pages.first().props().dangerouslySetInnerHTML).toEqual({__html: 'page1'});
    expect(pages.last().props().dangerouslySetInnerHTML).toEqual({__html: 'page3'});
  });

  it('should render every css inside a style ', () => {
    render();
    let styles = component.find('style');

    expect(styles.first().props()).toEqual({type: 'text/css', dangerouslySetInnerHTML: Object({__html: 'css'})});
  });

  describe('componentDidMount', () => {
    it('should instantiate a Text object with pageContainer', () => {
      render();
      instance.componentDidMount();
      expect(instance.text.container).toBe(instance.pagesContainer);
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

        component.find('.document').simulate('mouseup');
        expect(instance.onTextSelected).toHaveBeenCalled();

        instance.onTextSelected.calls.reset();
        component.find('.document').simulate('touchend');
        expect(instance.onTextSelected).toHaveBeenCalled();
      });
    });

    describe('when no text selected', () => {
      it('should unsetSelection', () => {
        spyOn(instance.text, 'selected').and.returnValue(false);

        component.find('.document').simulate('mouseup');

        expect(props.unsetSelection).toHaveBeenCalled();
      });

      it('should not call onTextSelected', () => {
        spyOn(instance, 'onTextSelected');
        spyOn(instance.text, 'selected').and.returnValue(false);

        component.find('.document').simulate('mouseup');
        expect(instance.onTextSelected).not.toHaveBeenCalled();

        instance.onTextSelected.calls.reset();
        component.find('.document').simulate('touchend');
        expect(instance.onTextSelected).not.toHaveBeenCalled();
      });
    });
  });

  describe('onTextSelected', () => {
    beforeEach(() => {
      props.selection = {selection: 'selection'};
      props.references = [{reference: 'reference'}];
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

    it('should render the references', () => {
      spyOn(instance.text, 'renderReferences');
      instance.componentDidUpdate();

      expect(instance.text.renderReferences).toHaveBeenCalledWith([{reference: 'reference'}]);
    });
  });
});
