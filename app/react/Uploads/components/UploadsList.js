import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {actions} from 'app/Metadata';

import {RowList} from 'app/Layout/Lists';
import UploadDoc from 'app/Uploads/components/UploadDoc';
import UploadEntity from 'app/Uploads/components/UploadEntity';
import {
  conversionComplete,
  updateDocument,
  selectDocument,
  unselectAllDocuments,
  unselectDocument,
  selectDocuments
} from 'app/Uploads/actions/uploadsActions';


export class UploadsList extends Component {

  componentWillMount() {
    this.props.socket.on('documentProcessed', (docId) => {
      this.props.conversionComplete(docId);
    });

    this.props.socket.on('conversionFailed', (docId) => {
      this.props.updateDocument({_id: docId, processed: false});
    });
  }

  clickOnDocument(e, doc, active) {
    const canSelectMultiple = this.props.authorized;
    const specialkeyPressed = e.metaKey || e.ctrlKey || e.shiftKey;

    if (!specialkeyPressed || !canSelectMultiple) {
      this.props.unselectAllDocuments();
    }

    if (active && !specialkeyPressed || !canSelectMultiple) {
      return this.props.selectDocument(doc);
    }

    if (active) {
      return this.props.unselectDocument(doc.get('_id'));
    }

    if (!active & e.shiftKey & canSelectMultiple) {
      const lastSelectedDocument = this.props.selectedDocuments.last();
      const docs = this.props.documents.toJS();
      const startIndex = docs.reduce((result, _doc, index) => {
        if (_doc._id === lastSelectedDocument.get('_id')) {
          return index;
        }
        return result;
      }, -1);

      const endIndex = docs.reduce((result, _doc, index) => {
        if (_doc._id === doc.get('_id')) {
          return index;
        }
        return result;
      }, -1);

      let docsToSelect = docs.slice(startIndex, endIndex + 1);
      if (endIndex < startIndex) {
        docsToSelect = docs.slice(endIndex, startIndex + 1);
      }
      return this.props.selectDocuments(docsToSelect);
    }

    this.props.selectDocument(doc);
    this.props.loadInReduxForm('uploads.metadata', doc.toJS(), this.props.templates.toJS());
  }

  render() {
    return (
      <RowList>
        {this.props.documents.map(doc => {
          if (doc.get('type') === 'document') {
            return <UploadDoc doc={doc} key={doc.get('_id')} onClick={this.clickOnDocument.bind(this)}/>;
          }

          return <UploadEntity entity={doc} key={doc.get('_id')} onClick={this.clickOnDocument.bind(this)}/>;
        })}
      </RowList>
    );
  }
}

UploadsList.propTypes = {
  documents: PropTypes.object,
  progress: PropTypes.object,
  socket: PropTypes.object,
  selectedDocuments: PropTypes.object,
  templates: PropTypes.object,
  authorized: PropTypes.bool,
  conversionComplete: PropTypes.func,
  updateDocument: PropTypes.func,
  selectDocument: PropTypes.func,
  selectDocuments: PropTypes.func,
  unselectDocument: PropTypes.func,
  unselectAllDocuments: PropTypes.func,
  loadInReduxForm: PropTypes.func
};

export function mapStateToProps(state) {
  return {
    documents: state.uploads.documents.sort((a, b) => b.get('creationDate') - a.get('creationDate')),
    selectedDocuments: state.uploads.uiState.get('selectedDocuments'),
    authorized: !!state.user.get('_id'),
    multipleSelected: state.uploads.uiState.get('selectedDocuments').size > 1,
    templates: state.templates
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({conversionComplete, updateDocument, selectDocument, selectDocuments, unselectAllDocuments, unselectDocument, loadInReduxForm: actions.loadInReduxForm}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadsList);
