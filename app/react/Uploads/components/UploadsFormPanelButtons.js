import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {t, I18NLink} from 'app/I18N';
import ShowIf from 'app/App/ShowIf';

import {deleteDocument, deleteEntity, moveToLibrary, publishEntity, unselectAllDocuments} from 'app/Uploads/actions/uploadsActions';

export class UploadsFormPanelButtons extends Component {

  publish() {
    this.context.confirm({
      accept: () => {
        if (this.props.metadata.type === 'document') {
          this.props.moveToLibrary(this.props.metadata);
        }

        this.props.publishEntity(this.props.metadata);
        this.props.unselectAllDocuments();
      },
      title: 'Confirm publish',
      message: `Are you sure you want to make ${this.props.metadata.title} public?`,
      type: 'success'
    });
  }

  delete() {
    this.context.confirm({
      accept: () => {
        this.props.unselectAllDocuments();
        if (this.props.metadata.type === 'document') {
          this.props.deleteDocument(this.props.metadata);
          return;
        }

        this.props.deleteEntity(this.props.metadata);
      },
      title: 'Confirm delete',
      message: `Are you sure you want to delete: ${this.props.metadata.title}?`
    });
  }

  render() {
    const metadata = this.props.metadata || {};
    const isViewable = !!metadata.processed || Boolean(metadata.type === 'entity' && metadata.sharedId);

    return (
      <div className="sidepanel-footer">
        <ShowIf if={isViewable}>
          <I18NLink to={`${metadata.type}/${metadata.sharedId}`}>
            <button className="edit-metadata btn btn-primary">
              <i className="fa fa-file-text-o"></i><span className="btn-label">{t('System', 'View')}</span>
            </button>
          </I18NLink>
        </ShowIf>
        <ShowIf if={!!metadata.template}>
          <button className="edit-metadata btn btn-primary"
                  onClick={this.publish.bind(this)}>
            <i className="fa fa-send"></i><span className="btn-label">{t('System', 'Publish')}</span>
          </button>
        </ShowIf>
        <ShowIf if={!!metadata.sharedId}>
          <button className="edit-metadata btn btn-danger"
                  onClick={this.delete.bind(this)}>
            <i className="fa fa-trash"></i><span className="btn-label">{t('System', 'Delete')}</span>
          </button>
        </ShowIf>
        <button className="edit-metadata btn btn-success"
                type="submit"
                form="metadataForm">
          <i className="fa fa-save"></i><span className="btn-label">{t('System', 'Save')}</span>
        </button>
      </div>
    );
  }
}

UploadsFormPanelButtons.propTypes = {
  metadata: PropTypes.object,
  deleteDocument: PropTypes.func,
  moveToLibrary: PropTypes.func,
  deleteEntity: PropTypes.func,
  publishEntity: PropTypes.func,
  unselectAllDocuments: PropTypes.func
};

UploadsFormPanelButtons.contextTypes = {
  confirm: PropTypes.func
};

const mapStateToProps = ({uploads}) => {
  return {
    metadata: uploads.uiState.get('metadataBeingEdited')
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({deleteDocument, deleteEntity, moveToLibrary, publishEntity, unselectAllDocuments}, dispatch);
}
export default connect(mapStateToProps, mapDispatchToProps)(UploadsFormPanelButtons);
