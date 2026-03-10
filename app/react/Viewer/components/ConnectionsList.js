import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { t, Translate } from 'app/I18N';
import { Icon } from 'UI';
import { Warning } from 'app/Layout';
import { closePanel, deactivateReference } from 'app/Viewer/actions/uiActions';
import Connection from './Connection';
import { sortTextSelections } from '../utils/sortTextSelections';

import 'app/Viewer/scss/viewReferencesPanel.scss';

class ConnectionsList extends Component {
  static blankStateMessage(title, message) {
    return (
      <div className="blank-state">
        <Icon icon="sitemap" />
        <h4>{t('System', title)}</h4>
        <p>{t('System', message)}</p>
      </div>
    );
  }

  // TODO: remove this method is it's not used anywhere
  // eslint-disable-next-line react/no-unused-class-component-methods
  close() {
    this.props.closePanel();
    this.props.deactivateReference();
  }

  render() {
    const references = this.props.references
      .toJS()
      .sort((a, b) => sortTextSelections(a.reference, b.reference));

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
        {references.length > 299 && (
          <Warning inline>
            <Translate translationKey="Text references limit warning">
              Text references are temporarily limited to a maximum of 300. We are currently working
              on a fix for this issue.
            </Translate>
          </Warning>
        )}
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

export { ConnectionsList };
export default connect(null, mapDispatchToProps)(ConnectionsList);
