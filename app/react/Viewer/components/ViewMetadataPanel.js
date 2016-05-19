import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import SidePanel from 'app/Layout/SidePanel';
import {helpers} from 'app/Documents';

export class ViewMetadataPanel extends Component {
  render() {
    const {doc} = this.props;

    return (
      <SidePanel open={this.props.open}>
        <h1>{doc.title}</h1>
        <i className="fa fa-close close-modal"></i>
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
      </SidePanel>
    );
  }
}

ViewMetadataPanel.propTypes = {
  doc: PropTypes.object,
  open: PropTypes.bool
};

const mapStateToProps = ({documentViewer}) => {
  return {
    open: documentViewer.uiState.get('panel') === 'viewMetadataPanel',
    doc: helpers.prepareMetadata(documentViewer.document, documentViewer.templates.toJS(), documentViewer.thesauris.toJS())
  };
};

export default connect(mapStateToProps)(ViewMetadataPanel);
