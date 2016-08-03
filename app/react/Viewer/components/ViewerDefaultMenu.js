import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {browserHistory} from 'react-router';

import {openPanel} from 'app/Viewer/actions/uiActions';
import {deleteDocument} from 'app/Viewer/actions/documentActions';
import {NeedAuthorization} from 'app/Auth';
import {ShowIf} from 'app/App/ShowIf';

export class ViewerDefaultMenu extends Component {

  deleteDocument() {
    this.context.confirm({
      accept: () => {
        this.props.deleteDocument(this.props.doc.toJS())
        .then(() => {
          browserHistory.push('/');
        });
      },
      title: 'Confirm delete document',
      message: 'Are you sure you want to delete this document?'
    });
  }

  render() {
    return (
      <div className={this.props.active ? 'active' : ''}>
        <ShowIf if={!this.props.targetDoc}>
          <div className="float-btn__sec">
            <a href={'/api/documents/download?_id=' + this.props.doc.toJS()._id} target="_blank" >
              <span>Download</span><i className="fa fa-cloud-download"></i>
            </a>
          </div>
        </ShowIf>
        <NeedAuthorization>
          <ShowIf if={!this.props.targetDoc}>
            <div onClick={this.deleteDocument.bind(this)} className="float-btn__sec">
              <span>Delete</span><i className="fa fa-trash"></i>
            </div>
          </ShowIf>
        </NeedAuthorization>
        <div onClick={this.props.openPanel.bind(null, 'viewMetadataPanel')} className="float-btn__sec view-metadata">
          <span>Metadata</span>
          <i className="fa fa-list-alt">
          </i>
        </div>
        <div onClick={this.props.openPanel.bind(null, 'viewReferencesPanel')} className="float-btn__sec view-references">
          <span>Connections</span>
          <i className="fa fa-link"></i>
        </div>
        <div className="float-btn__main"><i className="fa fa-bar-chart"></i></div>
      </div>
    );
  }
}

const mapStateToProps = ({documentViewer}) => {
  return {
    doc: documentViewer.doc,
    targetDoc: !!documentViewer.targetDoc.get('_id')
  };
};

ViewerDefaultMenu.propTypes = {
  active: PropTypes.bool,
  targetDoc: PropTypes.bool,
  openPanel: PropTypes.func,
  doc: PropTypes.object,
  deleteDocument: PropTypes.func
};

ViewerDefaultMenu.contextTypes = {
  confirm: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({openPanel, deleteDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewerDefaultMenu);
