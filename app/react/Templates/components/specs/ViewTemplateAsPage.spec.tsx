import React from 'react';
import Immutable from 'immutable';
import thunk from 'redux-thunk';

import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import { shallow, ShallowWrapper } from 'enzyme';
import { Provider } from 'react-redux';

import { ViewTemplateAsPage } from '../ViewTemplateAsPage';

const middlewares = [thunk];

describe('ViewTemplateAsPage', () => {
  const mockStoreCreator: MockStoreCreator<object> = configureStore<object>(middlewares);
  let component: ShallowWrapper<typeof ViewTemplateAsPage>;
  let store: MockStore<object>;
  const render = () => {
    component = shallow(
      <Provider store={store}>
        <ViewTemplateAsPage />
      </Provider>
    )
      .dive()
      .dive();
  };

  it('should contain a label with a tip, and toggled pages that can be used', () => {
    store = mockStoreCreator({
      pages: Immutable.fromJS([
        { title: 'page 1', _id: 'abc123', entityView: true },
        { title: 'page 2', _id: 'def345', entityView: false },
        { title: 'page 3', _id: 'df3485' },
      ]),
    });
    render();
    expect(component.find('label')).toHaveLength(1);
    expect(component.find('Tip')).toHaveLength(1);
    expect(component.find('ToggleChildren')).toHaveLength(1);
    expect(component.find('option').props().children).toBe('page 1');
  });

  it('should display a message saying that no pages are available if none are present', () => {
    store = mockStoreCreator({
      pages: Immutable.fromJS([
        { title: 'page 2', _id: 'def345', entityView: false },
        { title: 'page 3', _id: 'df3485' },
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
