import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';

import { NeedAuthorization } from 'app/Auth';
import { Translate, I18NLink } from 'app/I18N';
import { Icon } from 'UI';

import { ShareButton } from 'app/Permissions/components/ShareButton';
import * as actions from '../actions/actions';

class MetadataFormButtons extends Component {
  render() {
    const {
      entityBeingEdited,
      exclusivelyViewButton,
      formName,
      hideDelete,
      uploadFileprogress,
      formState,
    } = this.props;
    const data = this.props.data.toJS();
    const { submitFailed } = formState.$form;
    const shouldDisable =
      !submitFailed && (formState.$form.pending || uploadFileprogress !== undefined);

    const ViewButton = (
      <I18NLink
        to={`entity/${data.sharedId}`}
        className="edit-metadata btn btn-default"
        tabIndex="0"
      >
        <Icon icon="file" />
        <span className="btn-label">
          <Translate>View</Translate>
        </span>
      </I18NLink>
    );

    if (exclusivelyViewButton) {
      return <span>{ViewButton}</span>;
    }

    return (
      <>
        <div className="btn-cluster">
          {this.props.includeViewButton && data.sharedId && ViewButton}
          <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[data]}>
            {!entityBeingEdited && (
              <button
                type="button"
                onClick={() => {
                  this.props.loadInReduxForm(
                    this.props.formStatePath,
                    data,
                    this.props.templates.toJS()
                  );
                  this.props.clearMetadataSelections();
                }}
                className="edit-metadata btn btn-default"
              >
                <Icon icon="pencil-alt" />
                <span className="btn-label">
                  <Translate>Edit</Translate>
                </span>
              </button>
            )}
          </NeedAuthorization>
          <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[data]}>
            {!entityBeingEdited && !hideDelete && data && data.sharedId && (
              <ShareButton sharedIds={[data.sharedId]} storeKey={this.props.storeKey} />
            )}
          </NeedAuthorization>
          {entityBeingEdited && (
            <button
              type="button"
              className="btn btn-default copy-from-btn"
              onClick={this.props.copyFrom}
              disabled={shouldDisable}
            >
              <Icon icon="copy-from" transform="left-0.07 up-0.06" />
              <span className="btn-label">
                {' '}
                <Translate>Copy From</Translate>
              </span>
            </button>
          )}
        </div>
        <div className="btn-cluster content-right">
          {entityBeingEdited && (
            <>
              <button
                type="button"
                disabled={shouldDisable}
                onClick={() => this.props.resetForm(this.props.formStatePath)}
                className="cancel-edit-metadata btn btn-default btn-extra-padding"
              >
                <span className="btn-label">
                  <Translate>Cancel</Translate>
                </span>
              </button>
              <button
                type="submit"
                form={formName}
                className="btn btn-success btn-extra-padding"
                disabled={shouldDisable}
              >
                {uploadFileprogress ? <Icon icon="spinner" spin /> : null}
                <span className="btn-label">
                  {uploadFileprogress ? (
                    <span>{`${uploadFileprogress}%`}</span>
                  ) : (
                    <Translate>Save</Translate>
                  )}
                </span>
              </button>
            </>
          )}
          <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[data]}>
            {!entityBeingEdited && !hideDelete && (
              <button
                className="delete-metadata btn btn-danger"
                type="button"
                onClick={this.props.delete}
              >
                <Icon icon="trash-alt" />
                <span className="btn-label">
                  <Translate>Delete</Translate>
                </span>
              </button>
            )}
          </NeedAuthorization>
        </div>
      </>
    );
  }
}

MetadataFormButtons.defaultProps = {
  entityBeingEdited: false,
  includeViewButton: true,
  hideDelete: false,
  formName: 'metadataForm',
  delete: () => {},
  copyFrom: () => {},
  storeKey: undefined,
  uploadFileprogress: undefined,
};

MetadataFormButtons.propTypes = {
  loadInReduxForm: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired,
  clearMetadataSelections: PropTypes.func.isRequired,
  delete: PropTypes.func,
  templates: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
  entityBeingEdited: PropTypes.bool,
  formStatePath: PropTypes.string.isRequired,
  formState: PropTypes.instanceOf(Object).isRequired,
  formName: PropTypes.string,
  includeViewButton: PropTypes.bool,
  exclusivelyViewButton: PropTypes.bool,
  hideDelete: PropTypes.bool,
  copyFrom: PropTypes.func,
  storeKey: PropTypes.string,
  uploadFileprogress: PropTypes.number,
};

const mapStateToProps = (state, ownProps) => {
  const { sharedId } = ownProps.data.toJS();
  return {
    templates: state.templates,
    uploadFileprogress: sharedId
      ? state.attachments.progress.get(sharedId)
      : state.attachments.progress.get('NEW_ENTITY'),
  };
};

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    {
      loadInReduxForm: actions.loadInReduxForm,
      resetForm: actions.resetReduxForm,
      clearMetadataSelections: actions.clearMetadataSelections,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export { MetadataFormButtons };
export default connect(mapStateToProps, mapDispatchToProps)(MetadataFormButtons);
