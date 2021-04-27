import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';

import ShowIf from 'app/App/ShowIf';
import { NeedAuthorization } from 'app/Auth';
import { Translate, I18NLink } from 'app/I18N';
import { Icon } from 'UI';

import { ShareButton } from 'app/Permissions/components/ShareButton';
import * as actions from '../actions/actions';

export class MetadataFormButtons extends Component {
  render() {
    const { entityBeingEdited, exclusivelyViewButton, formName, hideDelete } = this.props;
    const data = this.props.data.toJS();

    const ViewButton = (
      <I18NLink
        to={`entity/${data.sharedId}`}
        className="edit-metadata btn btn-primary"
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
      <span>
        <ShowIf if={this.props.includeViewButton}>{ViewButton}</ShowIf>
        <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[data]}>
          <ShowIf if={!entityBeingEdited}>
            <button
              type="button"
              onClick={() =>
                this.props.loadInReduxForm(
                  this.props.formStatePath,
                  data,
                  this.props.templates.toJS()
                )
              }
              className="edit-metadata btn btn-primary"
            >
              <Icon icon="pencil-alt" />
              <span className="btn-label">
                <Translate>Edit</Translate>
              </span>
            </button>
          </ShowIf>
        </NeedAuthorization>
        <ShowIf if={entityBeingEdited}>
          <button
            type="button"
            onClick={() => this.props.resetForm(this.props.formStatePath)}
            className="cancel-edit-metadata btn btn-primary"
          >
            <Icon icon="times" />
            <span className="btn-label">
              <Translate>Cancel</Translate>
            </span>
          </button>
        </ShowIf>
        <ShowIf if={entityBeingEdited}>
          <>
            <button type="submit" form={formName} className="btn btn-success">
              <Icon icon="save" />
              <span className="btn-label">
                <Translate>Save</Translate>
              </span>
            </button>
            <button
              type="button"
              className="btn btn-success copy-from-btn"
              onClick={this.props.copyFrom}
            >
              <Icon icon="copy-from" transform="left-0.07 up-0.06" />
              <span className="btn-label">
                <Translate>Copy From</Translate>
              </span>
            </button>
          </>
        </ShowIf>
        <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[data]}>
          <ShowIf if={!entityBeingEdited && !hideDelete}>
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
          </ShowIf>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[data]}>
          {!entityBeingEdited && !hideDelete && data && data.sharedId && (
            <ShareButton sharedIds={[data.sharedId]} storeKey={this.props.storeKey} />
          )}
        </NeedAuthorization>
      </span>
    );
  }
}

MetadataFormButtons.contextTypes = {
  confirm: PropTypes.func,
};

MetadataFormButtons.defaultProps = {
  entityBeingEdited: false,
  includeViewButton: true,
  hideDelete: false,
  formName: 'metadataForm',
  delete: () => {},
  copyFrom: () => {},
  storeKey: undefined,
};

MetadataFormButtons.propTypes = {
  loadInReduxForm: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired,
  delete: PropTypes.func,
  templates: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
  entityBeingEdited: PropTypes.bool,
  formStatePath: PropTypes.string.isRequired,
  formName: PropTypes.string,
  includeViewButton: PropTypes.bool,
  exclusivelyViewButton: PropTypes.bool,
  hideDelete: PropTypes.bool,
  copyFrom: PropTypes.func,
  storeKey: PropTypes.string,
};

const mapStateToProps = ({ templates }) => ({ templates });

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    {
      loadInReduxForm: actions.loadInReduxForm,
      resetForm: actions.resetReduxForm,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataFormButtons);
