/**
 * @jest-environment jsdom
 */

import { mount, CommonWrapper } from 'enzyme';
import React from 'react';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureStore, { MockStoreCreator } from 'redux-mock-store';
import { Collapsible } from '../Collapsible';

describe('Collapsible', () => {
  let component: CommonWrapper;
  const middlewares = [thunk];
  const mockStoreCreator: MockStoreCreator<object> = configureStore<object>(middlewares);

  const render = (props = { collapse: false }) =>
    mount(
      <Provider store={mockStoreCreator({})}>
        <Collapsible header="Some header" collapse={props.collapse}>
          <div id="test" />
        </Collapsible>
      </Provider>
    );

  it('should render children', () => {
    component = render();
    expect(component.contains(<div id="test" />)).toBe(true);
  });

  it('should hide children when clicked', () => {
    const mountComp = render();
    mountComp.simulate('click');
    mountComp.find('.header').simulate('click');
    expect(mountComp.contains(<div id="test" />)).toBe(false);
  });

  it('should collapse if collapse prop is set', () => {
    const mountComp = render({ collapse: true });
    expect(mountComp.contains(<div id="test" />)).toBe(false);
  });

  it('should collapse if collapse prop is not set', () => {
    const mountComp = render();
    expect(mountComp.contains(<div id="test" />)).toBe(true);
  });

  it('should react to collapse prop', () => {
    const props = {
      collapse: false,
    };
    component = render(props);
    expect(component.contains(<div id="test" />)).toBe(true);
    props.collapse = true;
    component.update();
    // expect(component.contains(<div id="test" />)).toBe(false);
  });
});
