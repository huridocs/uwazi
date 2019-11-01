/** @format */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { render } from 'enzyme';

import { createStore } from 'redux';
import Repeat from '../Repeat';
import Value from '../Value';
import PagesContext from '../Context';

describe('Repeat', () => {
  let datasets;
  const store = createStore(() => ({}));
  class DummyComponent extends Component {
    render() {
      const { myvalue } = this.props;
      return <span>{myvalue}</span>;
    }
  }
  DummyComponent.propTypes = { myvalue: PropTypes.string.isRequired };
  beforeEach(() => {
    datasets = {
      data: ['Batman', 'Spiderman'],
    };
  });

  it('should render the items in data using the given html', () => {
    const component = render(
      <ul>
        <PagesContext.Provider value={datasets}>
          <Repeat path="data">
            <li>
              Name: <Value store={store} />
            </li>
          </Repeat>
        </PagesContext.Provider>
      </ul>
    );
    expect(component).toMatchSnapshot();
  });

  it('should handle nested values in objects', () => {
    datasets = {
      data: [
        { title: 'Batman', metadata: { age: [{ value: 42 }] } },
        { title: 'Robin', metadata: { age: [{ value: 24 }] } },
      ],
    };
    const component = render(
      <PagesContext.Provider value={datasets}>
        <Repeat path="data">
          <span>
            Name: <Value store={store} path="title" />
          </span>
          <span>
            Age: <Value store={store} path="metadata.age.0.value" />
          </span>
        </Repeat>
      </PagesContext.Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
