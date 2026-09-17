import { Component } from 'react';
import { ReactReduxContext } from 'react-redux';

class ReduxStoreComponent extends Component {
  static contextType = ReactReduxContext;

  constructor(props, context) {
    super(props, context);
    const fromContext = context?.store;
    this.reduxStore = props.store ?? (fromContext?.getState ? fromContext : undefined);
  }

  get store() {
    return this.props.store ?? this.context?.store ?? this.reduxStore;
  }
}

export { ReduxStoreComponent };
