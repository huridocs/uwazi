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
  close() {
    this.props.closePanel();
    this.props.deactivateReference();
  }

  componentWillReceiveProps(newProps) {
    Object.keys(newProps).map((key) => {
      if (newProps[key] !== this.props[key]) {
        console.log(key, newProps[key], this.props[key]);
      }
    });
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
      return (
        <div className="blank-state">
          <Icon icon="sitemap" />
          <h4>{t('System', 'No References')}</h4>
          <p>{t('System', 'No References description')}</p>
        </div>
      );
    }

    if (!this.props.references.size) {
      return (
        <div className="blank-state">
          <Icon icon="sitemap" />
          <h4>{t('System', 'No Connections')}</h4>
          <p>{t('System', 'No Connections description')}</p>
        </div>
      );
    }

    return (
      <div className="item-group">
        {(() => references.map((reference, index) => <Connection key={index} readOnly={this.props.readOnly} reference={reference} />))()}
      </div>
    );
  }
}
ConnectionsList.defaultProps = {
};


ConnectionsList.propTypes = {
  references: PropTypes.object,
  deactivateReference: PropTypes.func,
  closePanel: PropTypes.func,
  loading: PropTypes.bool,
  readOnly: PropTypes.bool,
  referencesSection: PropTypes.string,
};

ConnectionsList.contextTypes = {
  confirm: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ closePanel, deactivateReference }, dispatch);
}

export default connect(null, mapDispatchToProps)(ConnectionsList);
