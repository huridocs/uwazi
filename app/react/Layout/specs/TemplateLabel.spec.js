import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as immutable} from 'immutable';
import {TemplateLabel} from '../TemplateLabel';

describe('TemplateLabel', () => {
  let component;

  let props;

  beforeEach(() => {
    props = {
      template: 'templateId',
      templates: immutable([
        {_id: 'templateId', name: 'title'},
        {_id: 'templateId2', name: 'title 2', isEntity: true}
      ])
    };
  });

  let render = () => {
    component = shallow(<TemplateLabel {...props} />);
  };

  it('should render the name of the template', () => {
    render();
    expect(component.find('span').last().text()).toBe('title');

    props.template = 'templateId2';
    render();
    expect(component.find('span').last().text()).toBe('title 2');
  });

  it('should add consecutive type classNames for each template', () => {
    render();
    expect(component.find('span').first().props().className).toBe('item-type item-type-0');

    props.template = 'templateId2';
    render();
    expect(component.find('span').first().props().className).toBe('item-type item-type-1');
  });

  it('should set icon className based on isEntity flag', () => {
    render();
    expect(component.find('span i').first().props().className).toBe('item-type__icon fa fa-file-text-o');

    props.template = 'templateId2';
    render();
    expect(component.find('span i').first().props().className).toBe('item-type__icon fa fa-bank');
  });
});
