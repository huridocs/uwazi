import { Component } from 'react';
import { ReactReduxContext } from 'react-redux';

class ReduxStoreComponent extends Component {
  static contextType = ReactReduxContext;

  get store() {
    return this.props.store ?? this.context?.store;
  }
}

export { ReduxStoreComponent };
