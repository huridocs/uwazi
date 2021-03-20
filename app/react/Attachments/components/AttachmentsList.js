import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { advancedSort } from 'app/utils/advancedSort';
import { Translate } from 'app/I18N';
import { NeedAuthorization } from 'app/Auth';
import Attachment from 'app/Attachments/components/Attachment';

import UploadSupportingFile from './UploadSupportingFile';

export default class AttachmentsList extends Component {
  static arrangeFiles(files = []) {
    return advancedSort(files, { property: 'originalname' });
  }

  render() {
    const { parentId, parentSharedId, readOnly, storeKey } = this.props;
    const forcedReadOnly = readOnly || Boolean(this.props.isTargetDoc);

    let uploadAttachmentButton = null;
    if (!this.props.isTargetDoc) {
      uploadAttachmentButton = (
        <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
          <div className="attachment-add">
            <UploadSupportingFile entitySharedId={this.props.parentSharedId} storeKey={storeKey} />
          </div>
        </NeedAuthorization>
      );
    }

    const attachments = AttachmentsList.arrangeFiles(this.props.attachments);
    return (
      <div className="attachments-list-parent">
        <div className="attachments-list-header">
          <h2>
            <Translate>Supporting files</Translate>
          </h2>
          {uploadAttachmentButton}
        </div>
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
      </div>
    );
  }
}

AttachmentsList.defaultProps = {
  attachments: [],
  readOnly: false,
  isTargetDoc: false,
  parentId: null,
  parentSharedId: null,
  storeKey: '',
};

AttachmentsList.propTypes = {
  attachments: PropTypes.arrayOf(PropTypes.object),
  parentId: PropTypes.string,
  parentSharedId: PropTypes.string,
  readOnly: PropTypes.bool,
  isTargetDoc: PropTypes.bool,
  storeKey: PropTypes.string,
};

AttachmentsList.contextTypes = {
  confirm: PropTypes.func,
};
