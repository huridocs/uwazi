import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import filesize from 'filesize';
import {NeedAuthorization} from 'app/Auth';
import ShowIf from 'app/App/ShowIf';
import {advancedSort} from 'app/utils/advancedSort';
import t from 'app/I18N/t';

import {deleteAttachment} from '../actions/actions';
import UploadButton from 'app/Metadata/components/UploadButton';

export class AttachmentsList extends Component {

  deleteAttachment(attachment) {
    this.context.confirm({
      accept: () => {
        this.props.deleteAttachment(this.props.parentId, attachment);
      },
      title: 'Confirm delete',
      message: 'Are you sure you want to delete this attachment?'
    });
  }

  getExtension(filename) {
    return filename.substr(filename.lastIndexOf('.') + 1);
  }

  arrangeFiles(files, isDocumentAttachments) {
    let firstFiles = [];
    if (isDocumentAttachments) {
      firstFiles.push(files.shift());
    }

    const sortedFiles = advancedSort(files, {property: 'originalname'});
    return firstFiles.concat(sortedFiles);
  }

  getItemOptions(isSourceDocument, parentId, filename) {
    const options = {};
    options.itemClassName = isSourceDocument ? 'item-source-document' : '';
    options.typeClassName = isSourceDocument ? 'primary' : 'empty';
    options.icon = isSourceDocument ? 'file-pdf-o' : 'paperclip';
    options.showSourceDocumentLabel = isSourceDocument;
    options.deletable = !isSourceDocument;
    options.replaceable = isSourceDocument;
    options.downloadHref = isSourceDocument ?
                         `/api/documents/download?_id=${parentId}` :
                         `/api/attachments/download?_id=${parentId}&file=${filename}`;

    return options;
  }

  render() {
    const {parentId, parentSharedId, isDocumentAttachments} = this.props;
    const sortedFiles = this.arrangeFiles(this.props.files.toJS(), isDocumentAttachments);

    const list = sortedFiles.map((file, index) => {
      if (!file) {
        return;
      }

      const sizeString = file.size ? filesize(file.size) : '';

      const item = this.getItemOptions(isDocumentAttachments && index === 0, parentId, file.filename);

      return (
        <div key={index}
             className={`item highlight-hover ${item.itemClassName}`}>
          <div className="item-info">
            <div className="item-name">{file.originalname}</div>
          </div>
          <ShowIf if={Boolean(sizeString)}>
            <div className="item-metadata">
              <dl>
                <dt>{t('System', 'Size')}</dt>
                <dd>{sizeString}</dd>
              </dl>
            </div>
          </ShowIf>
          <div className="item-actions">
            <div className="item-label-group">
              <span className={`item-type item-type-${item.typeClassName}`}>
                <i className={`fa fa-${item.icon} item-type__icon`}></i>
                <span className="item-type__name">{this.getExtension(file.filename)}</span>
                <ShowIf if={item.showSourceDocumentLabel}>
                  <span className="label label-success">
                    <ShowIf if={!this.props.readOnly}>
                      <span>
                        <i className="fa fa-arrow-left"></i>
                        <span>You are reading this document</span>
                      </span>
                    </ShowIf>
                  </span>
                </ShowIf>
              </span>
            </div>
            <div className="item-shortcut-group">
              <NeedAuthorization>
                <ShowIf if={item.deletable && !this.props.readOnly}>
                  <a className="item-shortcut item-shortcut--danger" onClick={this.deleteAttachment.bind(this, file)}>
                    <i className="fa fa-trash"></i>
                  </a>
                </ShowIf>
              </NeedAuthorization>
              <NeedAuthorization>
                <ShowIf if={item.replaceable && !this.props.readOnly}>
                  <UploadButton documentId={parentId} documentSharedId={parentSharedId} />
                </ShowIf>
              </NeedAuthorization>
              &nbsp;
              <a className="item-shortcut"
                 href={item.downloadHref}
                 target="_blank">
                <i className="fa fa-download"></i>
              </a>
            </div>
          </div>
        </div>
      );
    });

    return <div className="item-group">{list}</div>;
  }
}

AttachmentsList.propTypes = {
  files: PropTypes.object,
  parentId: PropTypes.string,
  parentSharedId: PropTypes.string,
  isDocumentAttachments: PropTypes.bool,
  readOnly: PropTypes.bool,
  deleteAttachment: PropTypes.func
};

AttachmentsList.contextTypes = {
  confirm: PropTypes.func
};

function mapStateToProps() {
  return {progress: null};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({deleteAttachment}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AttachmentsList);
