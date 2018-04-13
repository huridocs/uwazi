import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { newUser } from 'app/Users/actions/actions';
import UserForm from './UserForm';

export class NewUser extends Component {
  render() {
    return (
      <UserForm submit={this.props.newUser}/>
    );
  }
}

NewUser.propTypes = {
  newUser: PropTypes.func.isRequired
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ newUser }, dispatch);
}

export default connect(null, mapDispatchToProps)(NewUser);
