import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { render } from 'enzyme';

import Connect from '../Connect';

describe('Connect', () => {
  let props;
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
      <Connect myvalue="value">
        <DummyComponent/>
      </Connect>
    );
    expect(component).toMatchSnapshot();
  });
});
