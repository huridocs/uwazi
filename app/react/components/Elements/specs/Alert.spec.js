import React, {Component} from 'react';
import TestUtils from 'react-addons-test-utils';

import Alert from '../Alert.js';

describe('Alert', () => {
  let component;

  class TestComponent extends Component {

    constructor(props) {
      super(props);
      this.state = {message: 'Finaly, you are up!', type: 'success'};
    }

    render() {
      return <Alert ref={(ref) => this.alert = ref} message={this.state.message} type={this.state.type}/>;
    }

  }

  describe('show', () => {
    it('should be true when the component has a message', () => {
      component = TestUtils.renderIntoDocument(<TestComponent/>);
      expect(component.alert.state.show).toBe(true);
    });
  });

  describe('hide()', () => {
    it('should set show to false', () => {
      expect(component.alert.state.show).toBe(true);
      component.alert.hide();
      expect(component.alert.state.show).toBe(false);
    });
  });

  describe('hide()', () => {
    it('should set show to false', () => {
      component.alert.setState({show: false});
      component.alert.show();
      expect(component.alert.state.show).toBe(true);
    });
  });
});
