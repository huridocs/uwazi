import {Component, PropTypes} from 'react';

export class ShowIf extends Component {
  render() {
    if (!this.props.if) {
      return false;
    }

    return this.props.children;
  }
}

ShowIf.propTypes = {
  children: PropTypes.any,
  if: PropTypes.bool
};


export default ShowIf;
