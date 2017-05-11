import PropTypes from 'prop-types';
import {Component} from 'react';
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
  array: PropTypes.array,
  authorized: PropTypes.bool
};

export function mapStateToProps({user}, props) {
  const roles = props.roles || ['admin'];
  return {
    authorized: !!(user.get('_id') && roles.includes(user.get('role')))
  };
}

export default connect(mapStateToProps)(NeedAuthorization);
