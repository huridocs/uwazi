import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import SidePanel from 'app/Layout/SidePanel';
import documents from 'app/Documents';
import {bindActionCreators} from 'redux';
import {saveDocument} from '../actions/documentActions';
import {closePanel} from '../actions/uiActions';

import DocumentForm from '../containers/DocumentForm';
import {ShowDocument} from 'app/Documents';

export class ViewMetadataPanel extends Component {
  submit(doc) {
    this.props.saveDocument(doc);
  }

  render() {
    const {doc, docBeingEdited} = this.props;

    return (
      <SidePanel open={this.props.open}>
        <h1>Metadata</h1>
        <i className="fa fa-close close-modal" onClick={this.props.closePanel}/>
        {(() => {
          if (docBeingEdited) {
            return <DocumentForm onSubmit={this.submit.bind(this)} />;
          }
          return <ShowDocument doc={doc}/>;
        })()}
      </SidePanel>
    );
  }
}

ViewMetadataPanel.propTypes = {
  doc: PropTypes.object,
  docBeingEdited: PropTypes.bool,
  open: PropTypes.bool,
  saveDocument: PropTypes.func,
  closePanel: PropTypes.func
};

const mapStateToProps = ({library}) => {
  return {
    open: library.uiState.get('metadataPanel').get('_id'),
    doc: documents.helpers.prepareMetadata(library.uiState.get('metadataPanel').toJS(), library.ui.templates.toJS(), library.ui.thesauris.toJS()),
    docBeingEdited: !!library.docForm._id
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveDocument, closePanel}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewMetadataPanel);
