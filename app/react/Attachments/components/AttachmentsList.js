import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { advancedSort } from 'app/utils/advancedSort';
import { t } from 'app/I18N';

import { NeedAuthorization } from 'app/Auth';
import Attachment from 'app/Attachments/components/Attachment';
import UploadAttachment from 'app/Attachments/components/UploadAttachment';
import UploadButton from 'app/Metadata/components/UploadButton';
import ViewDocButton from 'app/Library/components/ViewDocButton';
import Tip from '../../Layout/Tip';

export class AttachmentsList extends Component {
  static arrangeFiles(files = []) {
    return advancedSort(files, { property: 'originalname' });
  }

  renderDocuments(documents) {
    const { parentId, parentSharedId, readOnly, storeKey } = this.props;
    const forcedReadOnly = readOnly || Boolean(this.props.isTargetDoc);

    if (documents[0]) {
      documents[0]._id = parentId;
      return (
        <div>
          <h2>{t('System', 'Documents')}</h2>
          <div className="attachments-list">
            <Attachment
              file={documents[0]}
              parentId={parentId}
              readOnly={forcedReadOnly}
              storeKey={storeKey}
              parentSharedId={parentSharedId}
              isSourceDocument
              deleteMessage="Warning, Deleting the main file will also delete table of content and main files for the other languages of this entity"
            />
          </div>
          {this.props.entityView && documents[0] && (
            <ViewDocButton
              file={documents[0]}
              sharedId={parentSharedId}
              processed={this.props.processed}
              storeKey={storeKey}
            />
          )}
        </div>
      );
    }

    if (!forcedReadOnly) {
      return (
        <NeedAuthorization>
          <div className="attachment-buttons main-file">
            <h2>
              {t('System', 'Document')}
              <Tip>Main file: add a file as the main content</Tip>
            </h2>
            <UploadButton
              documentId={parentId}
              documentSharedId={parentSharedId}
              storeKey={storeKey}
            />
          </div>
        </NeedAuthorization>
      );
    }

    return null;
  }

  render() {
    const { parentId, parentSharedId, readOnly, storeKey } = this.props;
    const forcedReadOnly = readOnly || Boolean(this.props.isTargetDoc);

    let uploadAttachmentButton = null;
    if (!this.props.isTargetDoc) {
      uploadAttachmentButton = (
        <NeedAuthorization roles={['admin', 'editor']}>
          <div className="attachment-add">
            <UploadAttachment entity={this.props.parentId} storeKey={storeKey} />
          </div>
        </NeedAuthorization>
      );
    }

    const attachments = AttachmentsList.arrangeFiles(this.props.attachments);
    const documents = AttachmentsList.arrangeFiles(this.props.documents);
    return (
      <div className="attachments-list-parent">
        {this.renderDocuments(documents)}
        <h2>{t('System', 'Attachments')}</h2>
        <div className="attachments-list">
          {attachments.map((file, index) => (
            <Attachment
              key={index}
              file={file}
              parentId={parentId}
              readOnly={forcedReadOnly}
              storeKey={storeKey}
              parentSharedId={parentSharedId}
              isSourceDocument={false}
            />
          ))}
        </div>
        {uploadAttachmentButton}
      </div>
    );
  }
}

AttachmentsList.defaultProps = {
  attachments: [],
  documents: [],
  readOnly: true,
  entityView: false,
  processed: false,
  isTargetDoc: false,
  user: null,
  parentId: null,
  parentSharedId: null,
};

AttachmentsList.propTypes = {
  attachments: PropTypes.arrayOf(PropTypes.object),
  documents: PropTypes.arrayOf(PropTypes.object),
  parentId: PropTypes.string,
  parentSharedId: PropTypes.string,
  readOnly: PropTypes.bool,
  entityView: PropTypes.bool,
  processed: PropTypes.bool,
  isTargetDoc: PropTypes.bool,
  storeKey: PropTypes.string.isRequired,
  user: PropTypes.object,
};

AttachmentsList.contextTypes = {
  confirm: PropTypes.func,
};

function mapStateToProps({ user }) {
  return {
    user,
    progress: null,
    model: 'documentViewer.sidepanel.attachment',
  };
}

export default connect(mapStateToProps)(AttachmentsList);
