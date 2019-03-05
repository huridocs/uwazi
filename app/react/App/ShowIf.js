import PropTypes from 'prop-types';
import { Component } from 'react';

export class ShowIf extends Component {
  render() {
    if (!this.props.if) {
      return false;
    }

    return this.props.children;
  }
}

ShowIf.propTypes = {
  children: PropTypes.object,
  if: PropTypes.bool
};


export default ShowIf;
