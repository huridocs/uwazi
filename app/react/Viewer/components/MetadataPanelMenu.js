import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import documents from 'app/Documents';
import {MenuButtons} from 'app/ContextMenu';
import {NeedAuthorization} from 'app/Auth';

export class MetadataPanelMenu extends Component {
  render() {
    return (
      <div>
        {(() => {
          if (this.props.docForm && this.props.docForm._id) {
            let disabled = true;
            if (this.props.formState.dirty) {
              disabled = false;
            }

            return (
              <MenuButtons.Main disabled={disabled} >
                <button type="submit" form="documentForm" disabled={disabled}>
                  <i className="fa fa-save"></i>
                </button>
              </MenuButtons.Main>
              );
          }
          return (
            <NeedAuthorization>
              <MenuButtons.Main onClick={() => this.props.loadDocument('documentViewer.docForm', this.props.doc.toJS(), this.props.templates.toJS())}>
                <i className="fa fa-pencil"></i>
              </MenuButtons.Main>
            </NeedAuthorization>
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
  formState: PropTypes.object,
  loadDocument: PropTypes.func
};

const mapStateToProps = ({documentViewer}) => {
  return {
    doc: documentViewer.doc,
    templates: documentViewer.templates,
    docForm: documentViewer.docForm,
    formState: documentViewer.docFormState
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({loadDocument: documents.actions.loadDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataPanelMenu);
