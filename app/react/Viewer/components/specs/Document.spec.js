import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import Text from 'app/Viewer/utils/Text';
import {Document} from 'app/Viewer/components/Document.js';

describe('Document', () => {
  let component;
  let instance;

  let props;

  beforeEach(() => {
    props = {
      setSelection: jasmine.createSpy('setSelection'),
      unsetSelection: jasmine.createSpy('unsetSelection'),
      onClick: jasmine.createSpy('onClick'),
      doc: Immutable.fromJS({_id: 'documentId'}),
      docHTML: Immutable.fromJS({
        pages: ['page1', 'page2', 'page3'],
        css: 'css'
      })
    };
  });

  let render = () => {
    component = shallow(<Document {...props}/>);
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
    let pages = component.find('.pages').children();
    expect(pages.first().props().dangerouslySetInnerHTML).toEqual({__html: 'page1'});
    expect(pages.last().props().dangerouslySetInnerHTML).toEqual({__html: 'page3'});
  });

  it('should render every css inside a style ', () => {
    render();
    let styles = component.find('style');

    expect(styles.first().props()).toEqual({type: 'text/css', dangerouslySetInnerHTML: Object({__html: 'css'})});
  });

  describe('onClick', () => {
    describe('when executeOnClickHandler = true', () => {
      it('should execute onClick', () => {
        props.executeOnClickHandler = true;
        render();
        component.find('.pages').simulate('click', {target: {}});

        expect(props.onClick).toHaveBeenCalled();
      });
    });
    describe('when executeOnClickHandler = false', () => {
      it('should not execute onClick', () => {
        props.executeOnClickHandler = false;
        render();
        component.find('.pages').simulate('click', {target: {}});

        expect(props.onClick).not.toHaveBeenCalled();
      });
    });

    describe('when the target is a reference', () => {
      beforeEach(() => {
        props.references = [{reference: 'reference'}];
      });

      it('should activate the reference', () => {
        props.executeOnClickHandler = true;
        props.activateReference = jasmine.createSpy('activateReference');
        render();
        instance.text = {selected: jasmine.createSpy('selected').and.returnValue(false)};
        component.find('.pages').simulate('click', {target: {className: 'reference', getAttribute: () => 'referenceId'}});
        expect(props.activateReference).toHaveBeenCalledWith('referenceId', props.references);
        expect(props.onClick).not.toHaveBeenCalled();
      });

      describe('when text is selected', () => {
        it('should not active the reference', () => {
          props.executeOnClickHandler = true;
          props.activateReference = jasmine.createSpy('activateReference');
          render();
          instance.text = {selected: jasmine.createSpy('selected').and.returnValue(true)};
          component.find('.pages').simulate('click', {target: {className: 'reference', getAttribute: () => 'referenceId'}});
          expect(props.activateReference).not.toHaveBeenCalledWith('referenceId');
          expect(props.onClick).toHaveBeenCalled();
        });
      });
    });
  });

  describe('componentDidMount', () => {
    it('should instantiate a Text object with pageContainer', () => {
      render();
      instance.componentDidMount();
      expect(instance.text.container).toBe(instance.pagesContainer);
    });
  });

  describe('onMouseOver', () => {
    describe('when over a reference', () => {
      it('should highlightReference if over a reference', () => {
        props.highlightReference = jasmine.createSpy('highlightReference');
        render();

        component.find('.pages').simulate('mouseover', {target: {className: 'reference', getAttribute: () => 'referenceId'}});
        expect(props.highlightReference).toHaveBeenCalledWith('referenceId');
      });
    });
    describe('when not over a reference', () => {
      it('should unHighlight reference', () => {
        props.highlightReference = jasmine.createSpy('highlightReference');
        render();

        component.find('.pages').simulate('mouseover', {target: {className: '', getAttribute: () => ''}});
        expect(props.highlightReference).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('onMouseUp/onTouchEnd', () => {
    beforeEach(() => {
      render();
      instance.text = Text(instance.pagesContainer);
    });

    describe('when props.disableTextSelection', () => {
      it('should no execute onTextSelected', () => {
        props.disableTextSelection = true;
        render();
        spyOn(instance, 'onTextSelected');
        instance.text = Text(instance.pagesContainer);
        spyOn(instance.text, 'selected').and.returnValue(true);

        component.find('.pages').simulate('mouseup');
        expect(instance.onTextSelected).not.toHaveBeenCalled();
      });
    });

    describe('when text selected', () => {
      it('should call onTextSelected', () => {
        spyOn(instance, 'onTextSelected');
        spyOn(instance.text, 'selected').and.returnValue(true);

        component.find('.pages').simulate('mouseup');
        expect(instance.onTextSelected).toHaveBeenCalled();

        instance.onTextSelected.calls.reset();
        component.find('.pages').simulate('touchend');
        expect(instance.onTextSelected).toHaveBeenCalled();
      });
    });

    describe('when no text selected', () => {
      it('should unsetSelection', () => {
        spyOn(instance.text, 'selected').and.returnValue(false);

        component.find('.pages').simulate('mouseup');

        expect(props.unsetSelection).toHaveBeenCalled();
      });

      it('should not call onTextSelected', () => {
        spyOn(instance, 'onTextSelected');
        spyOn(instance.text, 'selected').and.returnValue(false);

        component.find('.pages').simulate('mouseup');
        expect(instance.onTextSelected).not.toHaveBeenCalled();

        instance.onTextSelected.calls.reset();
        component.find('.pages').simulate('touchend');
        expect(instance.onTextSelected).not.toHaveBeenCalled();
      });
    });
  });

  describe('onTextSelected', () => {
    beforeEach(() => {
      props.selection = {selection: 'selection'};
      props.highlightedReference = 'highlightedReference';
      props.references = [{reference: 'reference'}];
      props.forceSimulateSelection = true;
      render();
      instance.text = Text(instance.pagesContainer);
      spyOn(instance.text, 'getSelection').and.returnValue('serializedRange');
      spyOn(instance.text, 'simulateSelection');
      spyOn(instance.text, 'highlight');
      spyOn(instance.text, 'renderReferences');
    });

    it('should setSelection with the range serialized', () => {
      instance.onTextSelected();
      expect(props.setSelection).toHaveBeenCalledWith('serializedRange');
    });

    describe('componentDidUpdate', () => {
      it('should simulateSelection', () => {
        instance.componentDidUpdate();
        expect(instance.text.simulateSelection).toHaveBeenCalledWith({selection: 'selection'}, props.forceSimulateSelection);
      });

      it('should render the references', () => {
        instance.componentDidUpdate();

        expect(instance.text.renderReferences).toHaveBeenCalledWith([{reference: 'reference'}]);
      });

      it('should highlight the reference', () => {
        instance.componentDidUpdate();

        expect(instance.text.highlight).toHaveBeenCalledWith('highlightedReference');
      });
    });
  });
});
