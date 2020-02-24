import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { t } from 'app/I18N';
import { Icon } from 'UI';

import { closePanel, deactivateReference } from 'app/Viewer/actions/uiActions';
import Connection from './Connection';

import 'app/Viewer/scss/viewReferencesPanel.scss';

export class ConnectionsList extends Component {
  static blankStateMessage(title, message) {
    return (
      <div className="blank-state">
        <Icon icon="sitemap" />
        <h4>{t('System', title)}</h4>
        <p>{t('System', message)}</p>
      </div>
    );
  }

  close() {
    this.props.closePanel();
    this.props.deactivateReference();
  }

  render() {
    const references = this.props.references.toJS().sort((a, b) => {
      const aStart = typeof a.range.start !== 'undefined' ? a.range.start : -1;
      const bStart = typeof b.range.start !== 'undefined' ? b.range.start : -1;
      return aStart - bStart;
    });

    if (this.props.loading) {
      return false;
    }

    if (!this.props.references.size && this.props.referencesSection === 'references') {
      return ConnectionsList.blankStateMessage('No References', 'No References description');
    }

    if (!this.props.references.size) {
      return ConnectionsList.blankStateMessage('No Connections', 'No Connections description');
    }

    return (
      <div className="item-group">
        {(() =>
          references.map(reference => (
            <Connection key={reference._id} readOnly={this.props.readOnly} reference={reference} />
          )))()}
      </div>
    );
  }
}

ConnectionsList.propTypes = {
  references: PropTypes.object,
  deactivateReference: PropTypes.func,
  closePanel: PropTypes.func,
  loading: PropTypes.bool,
  readOnly: PropTypes.bool,
  referencesSection: PropTypes.string,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ closePanel, deactivateReference }, dispatch);
}

export default connect(null, mapDispatchToProps)(ConnectionsList);
