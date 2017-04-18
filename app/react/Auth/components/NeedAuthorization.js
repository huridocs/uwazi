import PropTypes from 'prop-types';
import { Component } from 'react';
import {connect} from 'react-redux';

export class NeedAuthorization extends Component {
  render() {
    if (!this.props.authorized) {
      return false;
    }

    return this.props.children;
  }
}

NeedAuthorization.propTypes = {
  children: PropTypes.object,
  authorized: PropTypes.bool
};

export function mapStateToProps({user}) {
  return {
    authorized: !!user.get('_id')
  };
}

export default connect(mapStateToProps)(NeedAuthorization);
