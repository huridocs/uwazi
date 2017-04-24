import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import Immutable from 'immutable';

import {advancedSort} from 'app/utils/advancedSort';

import Attachment from 'app/Attachments/components/Attachment';

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
    const {parentId, parentSharedId, isDocumentAttachments, readOnly} = this.props;
    const sortedFiles = this.arrangeFiles(this.props.files.toJS(), isDocumentAttachments);

    return <div className="item-group">
      {sortedFiles.map((file, index) => {
        return (
          <Attachment key={index}
            file={file}
            parentId={parentId}
            readOnly={readOnly}
            parentSharedId={parentSharedId}
            isSourceDocument={isDocumentAttachments && index === 0}
          />);
      })}
    </div>;
  }
}

AttachmentsList.propTypes = {
  files: PropTypes.object,
  parentId: PropTypes.string,
  model: PropTypes.string,
  parentSharedId: PropTypes.string,
  isDocumentAttachments: PropTypes.bool,
  readOnly: PropTypes.bool,
  deleteAttachment: PropTypes.func,
  loadForm: PropTypes.func
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
