import React from 'react';
import Immutable from 'immutable';
import thunk from 'redux-thunk';

import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import { shallow, ShallowWrapper } from 'enzyme';
import { Provider } from 'react-redux';

import { TemplateAsPageControl } from '../TemplateAsPageControl';

const middlewares = [thunk];

describe('TemplateAsPageControl', () => {
  const mockStoreCreator: MockStoreCreator<object> = configureStore<object>(middlewares);
  let component: ShallowWrapper<typeof TemplateAsPageControl>;
  let store: MockStore<object>;
  const render = () => {
    component = shallow(
      <Provider store={store}>
        <TemplateAsPageControl selectedPage="" />
      </Provider>
    )
      .dive()
      .dive();
  };

  it('should contain a label with a tip, and toggled pages that can be used for entity view', () => {
    store = mockStoreCreator({
      pages: Immutable.fromJS([
        { title: 'page 1', sharedId: 'abc123', entityView: true },
        { title: 'page 2', sharedId: 'def345', entityView: false },
        { title: 'page 3', sharedId: 'df3485' },
      ]),
    });
    render();
    expect(component.find('label')).toHaveLength(1);
    expect(component.find('Tip')).toHaveLength(1);
    expect(component.find('ToggleChildren')).toHaveLength(1);
    expect(component.find('Select').props()).toMatchObject({ options: [{ title: 'page 1' }] });
  });

  it('should display a message saying that no pages are available if none are present', () => {
    store = mockStoreCreator({
      pages: Immutable.fromJS([
        { title: 'page 2', sharedId: 'def345', entityView: false },
        { title: 'page 3', sharedId: 'df3485' },
      ]),
    });
    render();
    expect(component.find('label').props().children).toContain(
      'There are no pages enabled for entity view'
    );
  });

  it('should not throw error when there are no pages', () => {
    store = mockStoreCreator({
      pages: Immutable.fromJS(undefined),
    });
    render();
    expect(component.find('label').props().children).toContain(
      'There are no pages enabled for entity view'
    );
  });
});
