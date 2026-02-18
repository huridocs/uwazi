import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { RouteHandler } from '#app/App/RouteHandler.js';
import { Translate } from '#app/I18N/index.js';
import { withRouter } from '#app/componentWrappers.js';
import auth from '#app/Auth/index.js';

class UnlockAccount extends RouteHandler {
  unlockAccount() {
    const { username, code } = this.props.params;
    this.props
      .unlockAccount({ username, code })
      .then(() => {
        this.props.navigate('/login');
      })
      .catch(() => {
        this.props.navigate('/login');
      });
  }

  componentDidMount() {
    this.unlockAccount();
  }

  render() {
    return (
      <div className="content login-content">
        <div className="row">
          <div className="col-xs-12 col-sm-4 col-sm-offset-4 text-center">
            <Translate>Verifying...</Translate>
          </div>
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

export { UnlockAccount };
const ConnectedUnlockAccount = connect(null, mapDispatchToProps)(withRouter(UnlockAccount));
export { ConnectedUnlockAccount };
