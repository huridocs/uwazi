import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import { TemplateLabel } from '../TemplateLabel.js';

const mockStore = configureMockStore([]);

describe('TemplateLabel', () => {
  let component;

  let initialState;
  const props = { template: 'templateId' };

  beforeEach(() => {
    initialState = {
      templates: Immutable.fromJS([
        { _id: 'templateId', name: 'title' },
        { _id: 'templateId2', name: 'title 2', isEntity: true },
      ]),
    };
  });

  const render = (state = initialState, componentProps = props) => {
    const store = mockStore(state);
    component = shallow(
      <Provider store={store}>
        <TemplateLabel {...componentProps} />
      </Provider>
    )
      .find(TemplateLabel)
      .dive();
  };

  it('should render the name of the template', () => {
    render(initialState, { template: 'templateId' });
    expect(component.prop('name')).toBe('title');
    expect(component.prop('template')).toBe('templateId');

    render(initialState, { template: 'templateId2' });
    expect(component.prop('name')).toBe('title 2');
    expect(component.prop('template')).toBe('templateId2');
  });

  it('should add consecutive type classNames for each template', () => {
    render(initialState, { template: 'templateId' });
    expect(component.prop('className')).toBe('btn-color btn-color-0');

    render(initialState, { template: 'templateId2' });
    expect(component.prop('className')).toBe('btn-color btn-color-1');
  });

  it('should cycle back through colors if there more than 19 templates', () => {
    const templates = [];
    for (let i = 0; i < 20; i += 1) {
      templates.push({ _id: `templateId${i}`, name: `title ${i}` });
    }
    const stateWithMany = { templates: Immutable.fromJS(templates) };
    render(stateWithMany, { template: 'templateId19' });
    expect(component.prop('className')).toBe('btn-color btn-color-0');
  });

  it('should display the template color if template has a custom color', () => {
    const stateWithColor = {
      templates: Immutable.fromJS([{ _id: 'templateId', name: 'title', color: '#112233' }]),
    };
    render(stateWithColor, { template: 'templateId' });
    expect(component.prop('className')).toBe('btn-color');
    expect(component.prop('style')).toEqual({ backgroundColor: '#112233' });
  });
});
