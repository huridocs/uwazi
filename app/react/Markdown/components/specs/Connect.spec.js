import React from 'react';
import { render } from 'enzyme';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Immutable from 'immutable';

import Connect from '../Connect';
import Value from '../Value';

describe('Connect', () => {
  const DummyComponent = p => <span>{p.myvalue}</span>;
  let store = createStore(() => ({ cats: [{ name: 'Calcetines' }, { name: 'Zapatilla' }] }));
  it('should pass a value in the store to the child component ', () => {
    const component = render(
      <Provider store={store}>
        <Connect myvalue="cats.0.name">
          <DummyComponent />
        </Connect>
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });

  it('should pass a value in the store to the child component even whith immutables', () => {
    store = createStore(() => ({
      cats: Immutable.fromJS([{ name: 'Calcetines' }, { name: 'Zapatilla' }]),
    }));
    const component = render(
      <Provider store={store}>
        <Connect myvalue="cats.1.name">
          <DummyComponent />
        </Connect>
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });

  it('should expose the values in the context', () => {
    const component = render(
      <Provider store={store}>
        <span>
          <Connect cats="cats">
            <Value path="cats.0.name" />
          </Connect>
        </span>
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
