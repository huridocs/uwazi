import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { browserHistory } from 'react-router';
import RouteHandler from 'app/App/RouteHandler';

import auth from 'app/Auth';

export class UnlockAccount extends RouteHandler {
  unlockAccount() {
    const { username, code } = this.props.params;
    this.props
      .unlockAccount({ username, code })
      .then(() => {
        browserHistory.push('/login');
      })
      .catch(() => {
        browserHistory.push('/login');
      });
  }

  componentDidMount() {
    this.unlockAccount();
  }

  render() {
    return (
      <div className="content login-content">
        <div className="row">
          <div className="col-xs-12 col-sm-4 col-sm-offset-4 text-center">Verifying...</div>
        </div>
      </div>
    );
  }
}

UnlockAccount.propTypes = {
  unlockAccount: PropTypes.func,
  params: PropTypes.shape({
    username: PropTypes.string,
    code: PropTypes.string,
  }),
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      unlockAccount: auth.actions.unlockAccount,
    },
    dispatch
  );
}

export default connect(null, mapDispatchToProps)(UnlockAccount);
