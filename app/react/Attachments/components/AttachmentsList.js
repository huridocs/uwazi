import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';

import {advancedSort} from 'app/utils/advancedSort';
import {t} from 'app/I18N';

import {NeedAuthorization} from 'app/Auth';
import Attachment from 'app/Attachments/components/Attachment';
import UploadAttachment from 'app/Attachments/components/UploadAttachment';

export class AttachmentsList extends Component {
  getExtension(filename) {
    return filename.substr(filename.lastIndexOf('.') + 1);
  }

  arrangeFiles(files, isDocumentAttachments) {
    if (!files.length) {
      return files;
    }

    let firstFiles = [];
    if (isDocumentAttachments) {
      firstFiles.push(files.shift());
    }

    const sortedFiles = advancedSort(files, {property: 'originalname'});
    return firstFiles.concat(sortedFiles);
  }

  render() {
    const {parentId, parentSharedId, isDocumentAttachments, readOnly, storeKey} = this.props;
    const sortedFiles = this.arrangeFiles(this.props.files.toJS(), isDocumentAttachments);
    const forcedReadOnly = readOnly || Boolean(this.props.isTargetDoc);

    let uploadAttachmentButton = null;
    if (!this.props.isTargetDoc) {
      uploadAttachmentButton = <NeedAuthorization roles={['admin', 'editor']}>
                                <div className="attachment-add">
                                  <UploadAttachment entityId={this.props.parentId} storeKey={storeKey}/>
                                </div>
                               </NeedAuthorization>;
    }
    return (
      <div>
        <h2>{t('System', 'Downloads')}</h2>
        <div className="attachments-list">
          {sortedFiles.map((file, index) => {
            const isSourceDocument = isDocumentAttachments && index === 0;

            if (isSourceDocument) {
              file._id = parentId;
            }

            return <Attachment key={index}
                               file={file}
                               parentId={parentId}
                               readOnly={forcedReadOnly}
                               storeKey={storeKey}
                               parentSharedId={parentSharedId}
                               isSourceDocument={isSourceDocument}/>;
          })}
        </div>
        {uploadAttachmentButton}
      </div>
    );
  }
}

AttachmentsList.propTypes = {
  files: PropTypes.object,
  parentId: PropTypes.string,
  model: PropTypes.string,
  parentSharedId: PropTypes.string,
  isDocumentAttachments: PropTypes.bool,
  readOnly: PropTypes.bool,
  isTargetDoc: PropTypes.bool,
  deleteAttachment: PropTypes.func,
  loadForm: PropTypes.func,
  storeKey: PropTypes.string
};

AttachmentsList.contextTypes = {
  confirm: PropTypes.func
};

function mapStateToProps() {
  return {
    progress: null,
    model: 'documentViewer.sidepanel.attachment'
  };
}

export default connect(mapStateToProps)(AttachmentsList);
