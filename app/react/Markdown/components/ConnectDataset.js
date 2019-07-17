import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Connect from './Connect';

export default class ConnectDataset extends Component {
  render() {
    const { name, children } = this.props;
    const _props = { [name]: `page.datasets.${name}`, children };
    return <Connect {..._props}/>;
  }
}

ConnectDataset.defaultProps = {
  name: 'default'
};

ConnectDataset.propTypes = {
  name: PropTypes.string,
};
