import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import filesize from 'filesize';
import {NeedAuthorization} from 'app/Auth';
import ShowIf from 'app/App/ShowIf';
import t from 'app/I18N/t';

export class AttachmentsList extends Component {

  deleteAttachment(file) {
    console.log('deleteAttachment:', file);
  }

  getExtension(filename) {
    return filename.substr(filename.lastIndexOf('.') + 1);
  }

  render() {
    const {files, parentId} = this.props;

    const list = files.map((immutableFile, index) => {
      const file = immutableFile.toJS();
      const sizeString = file.size ? filesize(file.size) : '';

      return (
        <div key={index}
             className="item highlight-hover">
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
              <span className="item-type item-type-1">
                <span className="item-type__name no-icon">{this.getExtension(file.filename)}</span>
              </span>
            </div>
            <div className="item-shortcut-group">
              <NeedAuthorization>
                <a className="item-shortcut" onClick={this.deleteAttachment.bind(this, file)}>
                  <i className="fa fa-trash"></i>
                </a>
              </NeedAuthorization>
              &nbsp;
              <a className="item-shortcut"
                 href={`/api/attachments/download?_id=${parentId}&file=${file.filename}`}
                 target="_blank">
                <i className="fa fa-cloud-download"></i>
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
  parentId: PropTypes.string
};

function mapStateToProps() {
  return {progress: null};
}

export default connect(mapStateToProps)(AttachmentsList);
