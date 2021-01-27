import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';

import ShowIf from 'app/App/ShowIf';
import { NeedAuthorization } from 'app/Auth';
import { Translate, I18NLink } from 'app/I18N';
import { Icon } from 'UI';
import { publish, unpublish } from 'app/Uploads/actions/uploadsActions';
import entitiesUtils from 'app/Entities/utils/filterBaseProperties';

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

    const _publish = e => {
      e.stopPropagation();
      this.context.confirm({
        accept: () => {
          this.props.publish(entitiesUtils.filterBaseProperties(data));
        },
        title: 'Confirm',
        message: 'Are you sure you want to publish this entity?',
        type: 'success',
      });
    };
    const _unpublish = e => {
      e.stopPropagation();
      this.context.confirm({
        accept: () => {
          this.props.unpublish(entitiesUtils.filterBaseProperties(data));
        },
        title: 'Confirm',
        message: 'Are you sure you want to unpublish this entity?',
        type: 'warning',
      });
    };
    const isEntity = !data.file;
    const canBePublished = (data.processed || isEntity) && !data.published && !!data.template;
    return (
      <span>
        <ShowIf if={this.props.includeViewButton}>{ViewButton}</ShowIf>
        <NeedAuthorization roles={['admin', 'editor']}>
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
              <Icon icon="clone" />
              <span className="btn-label">
                <Translate>Copy From</Translate>
              </span>
            </button>
          </>
        </ShowIf>
        <NeedAuthorization roles={['admin', 'editor']}>
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
        <NeedAuthorization roles={['admin', 'editor']}>
          {!entityBeingEdited && !hideDelete && <ShareButton sharedIds={[data.sharedId]} />}
        </NeedAuthorization>
        <NeedAuthorization roles={['admin', 'editor']}>
          <ShowIf if={!entityBeingEdited && canBePublished}>
            <button className="publish btn btn-success" type="button" onClick={_publish}>
              <Icon icon="paper-plane" />
              <span className="btn-label">
                <Translate>Publish</Translate>
              </span>
            </button>
          </ShowIf>
        </NeedAuthorization>
        <NeedAuthorization roles={['admin', 'editor']}>
          <ShowIf if={data.published}>
            <button className="unpublish btn btn-warning" type="button" onClick={_unpublish}>
              <Icon icon="paper-plane" />
              <span className="btn-label">
                <Translate>Unpublish</Translate>
              </span>
            </button>
          </ShowIf>
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
};

MetadataFormButtons.propTypes = {
  loadInReduxForm: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired,
  delete: PropTypes.func,
  publish: PropTypes.func.isRequired,
  unpublish: PropTypes.func.isRequired,
  templates: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
  entityBeingEdited: PropTypes.bool,
  formStatePath: PropTypes.string.isRequired,
  formName: PropTypes.string,
  includeViewButton: PropTypes.bool,
  exclusivelyViewButton: PropTypes.bool,
  hideDelete: PropTypes.bool,
  copyFrom: PropTypes.func,
};

const mapStateToProps = ({ templates }) => ({ templates });

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    {
      loadInReduxForm: actions.loadInReduxForm,
      resetForm: actions.resetReduxForm,
      publish,
      unpublish,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataFormButtons);
