import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { render } from 'enzyme';

import { createStore } from 'redux';
import Repeat from '../Repeat';
import Value from '../Value';

describe('Repeat', () => {
  let props;
  const store = createStore(() => ({}));
  class DummyComponent extends Component {
    render() {
      const { myvalue } = this.props;
      return (<span>{myvalue}</span>);
    }
  }
  DummyComponent.propTypes = { myvalue: PropTypes.string.isRequired };
  beforeEach(() => {
    props = {
      data: ['Batman', 'Spiderman']
    };
  });

  it('should render the items in data using the given html', () => {
    const component = render(
      <Repeat {...props}>
        <span>Name: <Value store={store}/></span>
      </Repeat>
    );
    expect(component).toMatchSnapshot();
  });

  it('should handle nested values in objects', () => {
    props = {
      data: [{ title: 'Batman', metadata: { age: 42 } }, { title: 'Robin', metadata: { age: 24 } }]
    };
    const component = render(
      <Repeat {...props}>
        <span>Name: <Value store={store} path="title"/></span>
        <span>Age: <Value store={store} path="metadata.age"/></span>
      </Repeat>
    );
    expect(component).toMatchSnapshot();
  });
});
