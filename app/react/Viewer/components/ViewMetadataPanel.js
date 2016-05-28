import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import SidePanel from 'app/Layout/SidePanel';
import documents from 'app/Documents';
import {bindActionCreators} from 'redux';
import {saveDocument} from '../actions/documentActions';

import DocumentForm from '../containers/DocumentForm';

export class ViewMetadataPanel extends Component {
  submit(doc) {
    this.props.saveDocument(doc);
  }

  render() {
    const {doc, docBeingEdited} = this.props;

    return (
      <SidePanel open={this.props.open}>
        <i className="fa fa-close close-modal" />
        {(() => {
          if (docBeingEdited) {
            return <DocumentForm onSubmit={this.submit.bind(this)} />;
          }
          return (
            <div>
              <h1>{doc.title}</h1>
              <div className="view">
                <dl>
                  <dt>Document title</dt>
                  <dd>{doc.title}</dd>
                </dl>
                <dl>
                  <dt>Document type</dt>
                  <dd>{doc.documentType}</dd>
                </dl>

                {doc.metadata.map((property, index) => {
                  return (
                    <dl key={index}>
                      <dt>{property.label}</dt>
                      <dd>{property.value}</dd>
                    </dl>
                    );
                })}
              </div>
            </div>
            );
        })()}
      </SidePanel>
    );
  }
}

ViewMetadataPanel.propTypes = {
  doc: PropTypes.object,
  docBeingEdited: PropTypes.bool,
  open: PropTypes.bool,
  saveDocument: PropTypes.func
};

const mapStateToProps = ({documentViewer}) => {
  return {
    open: documentViewer.uiState.get('panel') === 'viewMetadataPanel',
    doc: documents.helpers.prepareMetadata(documentViewer.doc.toJS(), documentViewer.templates.toJS(), documentViewer.thesauris.toJS()),
    docBeingEdited: !!documentViewer.docForm._id
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewMetadataPanel);
