import * as Cookie from 'tiny-cookie';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isClient } from 'app/utils';
import { Translate } from 'app/I18N';

import { Notification } from 'app/Notifications/components/Notification';

class Cookiepopup extends Component {
  constructor(props) {
    super(props);
    this.state = { cookieExists: !isClient || (isClient && Boolean(Cookie.get('cookiepolicy'))) };
    this.close = this.close.bind(this);
  }

  close() {
    Cookie.set('cookiepolicy', 1, { expires: 365 * 10 });
    this.setState({ cookieExists: true });
  }

  render() {
    const { cookiepolicy } = this.props;
    const { cookieExists } = this.state;
    if (!cookiepolicy || cookieExists) {
      return <div className="alert-wrapper" />;
    }

    const message = (
      <Translate>To bring you a better experience, this site uses cookies.</Translate>
    );
    return (
      <div className="alert-wrapper">
        <Notification id="cookiepolicy" removeNotification={this.close} message={message} />
      </div>
    );
  }
}

Cookiepopup.propTypes = {
  cookiepolicy: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
  cookiepolicy: Boolean(state.settings.collection.get('cookiepolicy')),
});

export { Cookiepopup };
export default connect(mapStateToProps)(Cookiepopup);
