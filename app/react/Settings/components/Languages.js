import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { notify } from 'app/Notifications/actions/notificationsActions';
import { t } from 'app/I18N';

export class Languages extends Component {
  render() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Languages')}</div>
        <div className="panel-body">
          {this.props.languages.toString()}
        </div>
      </div>
    );
  }
}

Languages.propTypes = {
  languages: PropTypes.array,
};

export function mapStateToProps({ translations }) {
  return { languages: translations.map(tr => tr.get('locale')).toJS() };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ notify }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Languages);
