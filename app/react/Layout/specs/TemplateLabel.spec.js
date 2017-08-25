import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as immutable} from 'immutable';
import TemplateLabel from '../TemplateLabel';
import configureMockStore from 'redux-mock-store';

describe('TemplateLabel', () => {
  let component;

  let initialState;
  let props = {template: 'templateId'};

  beforeEach(() => {
    initialState = {
      templates: immutable([
        {_id: 'templateId', name: 'title'},
        {_id: 'templateId2', name: 'title 2', isEntity: true}
      ])
    };
  });

  let render = () => {
    let mockStore = configureMockStore();
    let store = mockStore(initialState);
    component = shallow(<TemplateLabel store={store} {...props}/>);
  };

  it('should render the name of the template', () => {
    render();
    expect(component.prop('name')).toBe('title');
    expect(component.prop('template')).toBe('templateId');

    props.template = 'templateId2';
    render();
    expect(component.prop('name')).toBe('title 2');
    expect(component.prop('template')).toBe('templateId2');
  });

  it('should add consecutive type classNames for each template', () => {
    props.template = 'templateId';
    render();
    expect(component.prop('typeIndex')).toBe('item-type item-type-0');

    props.template = 'templateId2';
    render();
    expect(component.prop('typeIndex')).toBe('item-type item-type-1');
  });
});
