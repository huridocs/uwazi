import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import documents from 'app/Documents';
import {MenuButtons} from 'app/ContextMenu';

export class MetadataPanelMenu extends Component {
  render() {
    return (
      <div>
        {(() => {
          if (this.props.docForm && this.props.docForm._id) {
            return (
              <MenuButtons.Main>
                <button type="submit" form="documentForm">
                  <i className="fa fa-save"></i>
                </button>
              </MenuButtons.Main>
              );
          }
          return (
            <MenuButtons.Main onClick={() => this.props.loadDocument('documentViewer.docForm', this.props.doc, this.props.templates.toJS())}>
              <i className="fa fa-pencil"></i>
            </MenuButtons.Main>
            );
        })()}
      </div>
    );
  }
}

MetadataPanelMenu.propTypes = {
  templates: PropTypes.object,
  doc: PropTypes.object,
  docForm: PropTypes.object,
  loadDocument: PropTypes.func
};

const mapStateToProps = ({documentViewer}) => {
  return {
    doc: documentViewer.document,
    templates: documentViewer.templates,
    docForm: documentViewer.docForm
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({loadDocument: documents.actions.loadDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataPanelMenu);
