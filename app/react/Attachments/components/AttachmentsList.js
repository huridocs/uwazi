import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Translate } from 'app/I18N';
import { advancedSort } from 'app/utils/advancedSort';
import { NeedAuthorization } from 'app/Auth';
import Attachment from 'app/Attachments/components/Attachment';

import UploadSupportingFile from './UploadSupportingFile';

class AttachmentsList extends Component {
  static arrangeFiles(files = []) {
    return advancedSort(files, { property: 'originalname' });
  }

  render() {
    const label = (
      <h2>
        <Translate>Supporting files</Translate>
      </h2>
    );

    const { parentId, parentSharedId, readOnly, storeKey, entity } = this.props;
    const forcedReadOnly = readOnly || Boolean(this.props.isTargetDoc);

    let uploadAttachmentButton = null;

    if (!forcedReadOnly) {
      uploadAttachmentButton = (
        <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[entity]}>
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
          {attachments.length === 0 ? (
            <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[entity]}>
              {label}
            </NeedAuthorization>
          ) : (
            <>{label}</>
          )}
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
              entity={entity}
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
  entity: null,
};

AttachmentsList.propTypes = {
  attachments: PropTypes.arrayOf(PropTypes.object),
  parentId: PropTypes.string,
  parentSharedId: PropTypes.string,
  readOnly: PropTypes.bool,
  isTargetDoc: PropTypes.bool,
  storeKey: PropTypes.string,
  entity: PropTypes.object,
};

AttachmentsList.contextTypes = {
  confirm: PropTypes.func,
};

export default AttachmentsList;
