/** @format */

import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Translate } from 'app/I18N';
import { Icon } from 'UI';
import { bindActionCreators } from 'redux';
import { closeImportProgress } from 'app/Uploads/actions/uploadsActions';
import Immutable from 'immutable';
import StackTrace from 'app/components/Elements/StackTrace';

export class ImportProgress extends Component {
  render() {
    const {
      close,
      importState: { importStart, importProgress, importError, importEnd },
    } = this.props;
    if (!importStart && !importProgress) {
      return false;
    }
    if (importEnd) {
      return (
        <div className="alert alert-info">
          <Icon icon="check" size="2x" />
          <div className="force-ltr">
            <Translate translationKey="Import completed">
              Import completed. Number of entities created:
            </Translate>
            &nbsp;
            {importProgress}
            <br />
            <Translate>Indexing entities may take a few minutes</Translate>
          </div>
          <Icon style={{ cursor: 'pointer' }} icon="times" onClick={close} />
        </div>
      );
    }

    if (importError.get('prettyMessage')) {
      return (
        <div>
          <div className="alert alert-danger">
            <Icon icon="exclamation-triangle" size="2x" />
            <div className="force-ltr">
              <Translate>The import process threw an error:</Translate>
            </div>
            <Icon style={{ cursor: 'pointer' }} icon="times" onClick={close} />
          </div>
          <StackTrace
            message={importError.get('prettyMessage')}
            validations={importError.get('validations')}
          />
        </div>
      );
    }

    return (
      <div className="alert alert-info">
        <Icon icon="cog" size="2x" />
        <div className="force-ltr">
          <Translate>Importing data in progress</Translate>: {importProgress}
        </div>
      </div>
    );
  }
}

ImportProgress.propTypes = {
  importState: PropTypes.shape({
    importStart: PropTypes.bool.isRequired,
    importEnd: PropTypes.bool.isRequired,
    importProgress: PropTypes.number.isRequired,
    importError: PropTypes.instanceOf(Immutable.Map).isRequired,
  }).isRequired,
  close: PropTypes.func.isRequired,
};

export const mapStateToProps = state => ({
  importState: state.importEntities,
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ close: closeImportProgress }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ImportProgress);
