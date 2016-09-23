import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import ShowIf from 'app/App/ShowIf';
import {NeedAuthorization} from 'app/Auth';

import {actions} from 'app/Metadata';

export class MetadataFormButtons extends Component {
  render() {
    const {entityBeingEdited} = this.props;
    return <div className="sidepanel-footer">
      <NeedAuthorization>
        <ShowIf if={!entityBeingEdited}>
          <button
            onClick={() => this.props.loadInReduxForm(this.props.formStatePath, this.props.data.toJS(), this.props.templates.toJS())}
            className="edit-metadata btn btn-primary">
            <i className="fa fa-pencil"></i>
            <span className="btn-label">Edit</span>
          </button>
        </ShowIf>
      </NeedAuthorization>
      <ShowIf if={entityBeingEdited}>
        <button
          onClick={() => this.props.resetForm(this.props.formStatePath)}
          className="cancel-edit-metadata btn btn-primary">
          <i className="fa fa-close"></i>
          <span className="btn-label">Cancel</span>
        </button>
      </ShowIf>
      <ShowIf if={entityBeingEdited}>
        <button type="submit" form={this.props.formName} className="btn btn-success">
          <i className="fa fa-save"></i>
          <span className="btn-label">Save</span>
        </button>
      </ShowIf>
      <NeedAuthorization>
        <button className="delete-metadata btn btn-danger" onClick={this.props.delete}>
          <i className="fa fa-trash"></i>
          <span className="btn-label">Delete</span>
        </button>
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
    resetForm: actions.resetform
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataFormButtons);
