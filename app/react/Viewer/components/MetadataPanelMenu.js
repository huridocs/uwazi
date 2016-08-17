import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {actions} from 'app/Metadata';
import {MenuButtons} from 'app/ContextMenu';
import {NeedAuthorization} from 'app/Auth';

export class MetadataPanelMenu extends Component {
  render() {
    if (this.props.targetDoc) {
      return false;
    }
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
                <button type="submit" form="metadataForm" disabled={disabled}>
                  <i className="fa fa-save"></i>
                </button>
              </MenuButtons.Main>
              );
          }
          return (
            <NeedAuthorization>
              <MenuButtons.Main onClick={() => this.props.loadInReduxForm('documentViewer.docForm', this.props.doc.toJS(), this.props.templates.toJS())}>
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
  loadInReduxForm: PropTypes.func,
  targetDoc: PropTypes.bool
};

const mapStateToProps = ({documentViewer}) => {
  return {
    doc: documentViewer.doc,
    templates: documentViewer.templates,
    docForm: documentViewer.docForm,
    formState: documentViewer.docFormState,
    targetDoc: !!documentViewer.targetDoc.get('_id')
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({loadInReduxForm: actions.loadInReduxForm}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataPanelMenu);
