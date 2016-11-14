import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import ShowIf from 'app/App/ShowIf';
import {NeedAuthorization} from 'app/Auth';
import t from 'app/I18N/t';

import * as actions from '../actions/actions';

export class MetadataFormButtons extends Component {
  render() {
    const {entityBeingEdited} = this.props;
    const formName = this.props.formName || 'metadataForm';
    const data = this.props.data.toJS();
    return <div className="sidepanel-footer">
      <NeedAuthorization>
        <ShowIf if={!entityBeingEdited}>
          <button
            onClick={() => this.props.loadInReduxForm(this.props.formStatePath, data, this.props.templates.toJS())}
            className="edit-metadata btn btn-primary">
            <i className="fa fa-pencil"></i>
            <span className="btn-label">{t('System', 'Edit')}</span>
          </button>
        </ShowIf>
      </NeedAuthorization>
      <ShowIf if={entityBeingEdited}>
        <button
          onClick={() => this.props.resetForm(this.props.formStatePath)}
          className="cancel-edit-metadata btn btn-primary">
          <i className="fa fa-close"></i>
          <span className="btn-label">{t('System', 'Cancel')}</span>
        </button>
      </ShowIf>
      <ShowIf if={entityBeingEdited}>
        <button type="submit" form={formName} className="btn btn-success">
          <i className="fa fa-save"></i>
          <span className="btn-label">{t('System', 'Save')}</span>
        </button>
      </ShowIf>
      <NeedAuthorization>
        <ShowIf if={!entityBeingEdited}>
          <button className="delete-metadata btn btn-danger" onClick={this.props.delete}>
            <i className="fa fa-trash"></i>
            <span className="btn-label">{t('System', 'Delete')}</span>
          </button>
        </ShowIf>
      </NeedAuthorization>
    </div>;
  }
}

MetadataFormButtons.propTypes = {
  loadInReduxForm: PropTypes.func,
  resetForm: PropTypes.func,
  delete: PropTypes.func,
  templates: PropTypes.object,
  data: PropTypes.object,
  entityBeingEdited: PropTypes.bool,
  formStatePath: PropTypes.string,
  formName: PropTypes.string
};

const mapStateToProps = ({templates}) => {
  return {templates};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    loadInReduxForm: actions.loadInReduxForm,
    resetForm: actions.resetReduxForm
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataFormButtons);
