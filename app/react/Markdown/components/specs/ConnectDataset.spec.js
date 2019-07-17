import React from 'react';
import { render } from 'enzyme';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Immutable from 'immutable';

import ConnectDataset from '../ConnectDataset';
import Value from '../Value';
import Repeat from '../Repeat';

describe('ConnectDataset', () => {
  let store = createStore(() => ({ page: { datasets: { default: Immutable.fromJS([{ name: 'Calcetines' }, { name: 'Zapatilla' }]) } } }));
  it('should pass the value in the default dataset of pages', () => {
    const component = render(
      <Provider store={store}>
        <span>
          <ConnectDataset>
            <Value path="default.0.name"/>
          </ConnectDataset>
        </span>
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });

  it('should pass the dataset specified by name prop', () => {
    store = createStore(() => ({ page: { datasets: { cats: Immutable.fromJS([{ name: 'Calcetines' }, { name: 'Zapatilla' }]) } } }));
    const component = render(
      <Provider store={store}>
        <span>
          <ConnectDataset name="cats">
            <Value path="cats.0.name"/>
          </ConnectDataset>
        </span>
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
