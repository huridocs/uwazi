import React from 'react';
import { shallow } from 'enzyme';
import { fromJS as immutable } from 'immutable';
import configureMockStore from 'redux-mock-store';
import TemplateLabel from '../TemplateLabel';

describe('TemplateLabel', () => {
  let component;

  let initialState;
  const props = { template: 'templateId' };

  beforeEach(() => {
    initialState = {
      templates: immutable([
        { _id: 'templateId', name: 'title' },
        { _id: 'templateId2', name: 'title 2', isEntity: true }
      ])
    };
  });

  const render = () => {
    const mockStore = configureMockStore();
    const store = mockStore(initialState);
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
    expect(component.prop('typeIndex')).toBe('btn-color btn-color-0');

    props.template = 'templateId2';
    render();
    expect(component.prop('typeIndex')).toBe('btn-color btn-color-1');
  });

  it('should cycle back through colors if there more than 18 templates', () => {
    const templates = [];
    for (let i = 0; i < 19; i += 1) {
      templates.push({ _id: `templateId${i}`, name: `title ${i}` });
    }
    initialState.templates = immutable(templates);
    props.template = 'templateId18';
    render();
    expect(component.prop('typeIndex')).toBe('btn-color btn-color-0');
  });
});
