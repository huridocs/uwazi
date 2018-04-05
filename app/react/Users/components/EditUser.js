import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import { saveUser } from 'app/Users/actions/actions';
import UserForm from './UserForm';

export class EditUser extends Component {
  render() {
    return <UserForm submit={this.props.saveUser} user={this.props.user}/>;
  }
}

EditUser.defaultProps = {
  user: Immutable.fromJS({})
};

EditUser.propTypes = {
  saveUser: PropTypes.func.isRequired,
  user: PropTypes.instanceOf(Immutable.Map)
};

export function mapStateToProps({ users }, props) {
  return { user: users.find(user => user.get('_id') === props.params.userId) };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ saveUser }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditUser);
