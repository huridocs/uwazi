import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Translate } from 'app/I18N';
import { Icon } from 'UI';
import { bindActionCreators } from 'redux';
import { closeImportProgress } from 'app/Uploads/actions/uploadsActions';

export class ImportProgress extends Component {
  render() {
    const { close, importState: { importStart, importProgress, importError, importEnd } } = this.props;
    if (!importStart && !importProgress) {
      return false;
    }
    if (importEnd) {
      return (
        <div className="alert alert-info">
          <Icon icon="check" size="2x" />
          <div className="force-ltr">
            <Translate>Import completed</Translate>, {importProgress} <Translate>processed</Translate>
          </div>
          <Icon style={{ cursor: 'pointer' }} icon="times" onClick={close}/>
        </div>
      );
    }

    if (importError.get('message')) {
      return (
        <div className="alert alert-danger">
          <Icon icon="exclamation-triangle" size="2x" />
          <div className="force-ltr">
            <Translate>Import error</Translate>
            <p>{importError.get('message')}</p>
          </div>
          <Icon style={{ cursor: 'pointer' }} icon="times" onClick={close}/>
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
  importState: PropTypes.object.isRequired,
  close: PropTypes.func.isRequired
};

export const mapStateToProps = state => ({
    importState: state.importEntities
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ close: closeImportProgress }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ImportProgress);
