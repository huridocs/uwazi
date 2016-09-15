import React from 'react';
import {shallow} from 'enzyme';
import {fromJS} from 'immutable';

import {NavlinkForm, LinkSource, LinkTarget, mapStateToProps} from '../NavlinkForm';

import {FormField} from 'app/Forms';

describe('Drag and Drop functions', () => {
  describe('LinkSource', () => {
    it('should have a beginDrag function that returns the index and id of the linked object', () => {
      expect(LinkSource.beginDrag({localID: 'localID', index: 3})).toEqual({id: 'localID', index: 3});
    });
  });

  describe('LinkTarget', () => {
    let props;
    let monitor;
    let component;

    beforeEach(() => {
      props = {sortLink: jasmine.createSpy('sortLink')};
      monitor = {
        getItem() {
          return {index: 3};
        }
      };
    });

    describe('hover', () => {
      it('should not replace items with themselves', () => {
        props.index = 3;
        LinkTarget.hover(props, monitor, component);
        expect(props.sortLink).not.toHaveBeenCalled();
      });

      // Missing a lot of positional-aware tests
    });
  });
});

describe('NavlinkForm', () => {
  let component;
  let props;
  const dragAndDropConnects = {};

  beforeEach(() => {
    dragAndDropConnects.connectDragSource = (dropTargetHtml) => {
      return dropTargetHtml.html;
    };

    dragAndDropConnects.connectDropTarget = (html) => {
      return {html};
    };

    spyOn(dragAndDropConnects, 'connectDragSource').and.callThrough();
    spyOn(dragAndDropConnects, 'connectDropTarget').and.callThrough();

    props = {
      link: {localID: 'newLink1'},
      id: 'newLink1',
      index: 1,
      uiState: fromJS({editingLink: 0}),
      formState: {errors: {}},
      editLink: jasmine.createSpy('editLink'),
      removeLink: jasmine.createSpy('removeLink'),
      sortLink: jasmine.createSpy('sortLink'),
      isDragging: false,
      connectDragSource: dragAndDropConnects.connectDragSource,
      connectDropTarget: dragAndDropConnects.connectDropTarget
    };

    component = shallow(<NavlinkForm {...props} />);
  });

  it('should render a list-group-item wrapped inside dragSource and dropTarget functionality', () => {
    expect(dragAndDropConnects.connectDragSource.calls.argsFor(0)[0].html.type).toBe('li');
    expect(dragAndDropConnects.connectDropTarget.calls.argsFor(0)[0].type).toBe('li');
    expect(component.find('li').props().className).toBe('list-group-item');
  });

  it('should add the dragging class if isDragging', () => {
    props.isDragging = true;
    component = shallow(<NavlinkForm {...props} />);
    expect(component.find('li').props().className).toBe('list-group-item dragging');
  });

  it('should have an edit button to activate editing link mode', () => {
    component.find('button').last().props().onClick();
    expect(props.editLink).toHaveBeenCalledWith('newLink1');
  });

  it('should have a remove button to remove a link', () => {
    component.find('button').first().props().onClick();
    expect(props.removeLink).toHaveBeenCalledWith(1);
  });

  it('should have a title and URL fields', () => {
    expect(component.find(FormField).first().props().model).toBe('settings.navlinksData.links[1].title');
    expect(component.find(FormField).first().parent().props().className).toBe('input-group');
    expect(component.find(FormField).last().props().model).toBe('settings.navlinksData.links[1].url');
  });

  describe('validation error states', () => {
    it('should add error to root li and has-error to title input', () => {
      props.formState.errors['links.1.title.required'] = true;
      component = shallow(<NavlinkForm {...props} />);

      expect(component.find('li').props().className).toBe('list-group-item error');
      expect(component.find(FormField).first().parent().props().className).toBe('input-group has-error');
    });
  });

  describe('mapStateToProps', () => {
    const settings = {
      navlinksFormState: 'formState',
      uiState: 'uiState'
    };

    it('should return the right props', () => {
      expect(mapStateToProps({settings})).toEqual({formState: 'formState', uiState: 'uiState'});
    });
  });
});
