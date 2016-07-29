import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {Field, Form, actions as formActions} from 'react-redux-form';
import {connect} from 'react-redux';
import {Link} from 'react-router';

import FormGroup from 'app/DocumentForm/components/FormGroup';
import {saveRelationType, resetRelationType} from 'app/RelationTypes/actions/relationTypeActions';

export class RelationTypeForm extends Component {

  componentWillUnmount() {
    this.props.resetForm('relationType');
  }

  validation(relationTypes, id) {
    return {
      name: {
        required: (val) => val.trim() !== '',
        duplicated: (val) => {
          return !relationTypes.find((relationType) => {
            return relationType._id !== id && relationType.name.trim().toLowerCase() === val.trim().toLowerCase();
          });
        }
      }
    };
  }

  render() {
    return (
      <div className="row relationType">
        <div className="col-xs-12 col-sm-4">
          <div className="panel panel-default">
            <div className="panel-heading">Settings</div>
            <div className="list-group">
              <button className="list-group-item">Account</button>
              <button className="list-group-item">Collection</button>
            </div>
          </div>
          <div className="panel panel-default">
            <div className="panel-heading">Metadata</div>
            <div className="list-group">
              <button className="list-group-item">Document types</button>
              <button className="list-group-item active">Relation types</button>
              <button className="list-group-item">Thesauris</button>
            </div>
          </div>
        </div>
        <main className="col-xs-12 col-sm-8">
          <Form
            model="relationType"
            onSubmit={this.props.saveRelationType}
            validators={this.validation(this.props.relationTypes.toJS(), this.props.relationType._id)}
          >
            <div className="panel panel-default">
              <div className="panel-heading relationType">
                <Link to="/metadata" className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</Link>
                &nbsp;
                <FormGroup {...this.props.state.fields.name} submitFailed={this.props.state.submitFailed}>
                  <Field model="relationType.name">
                      <input id="relationTypeName" className="form-control" type="text"/>
                  </Field>
                </FormGroup>
                &nbsp;
                <button type="submit" className="btn btn-success save-template">
                  <i className="fa fa-save"/> Save
                </button>
                {(() => {
                  if (this.props.state.dirty && this.props.state.fields.name && this.props.state.fields.name.errors.duplicated) {
                    return <div className="validation-error">
                              <i className="fa fa-exclamation-triangle"></i>
                              &nbsp;
                              Duplicated name
                          </div>;
                  }
                })()}
              </div>
              <div className="panel-body">Relations doesn't have content to edit.</div>
            </div>
          </Form>
        </main>
      </div>
    );
  }
}

RelationTypeForm.propTypes = {
  relationType: PropTypes.object.isRequired,
  relationTypes: PropTypes.object,
  saveRelationType: PropTypes.func,
  resetRelationType: PropTypes.func,
  resetForm: PropTypes.func,
  state: PropTypes.object
};

export function mapStateToProps(state) {
  return {
    relationType: state.relationType,
    relationTypes: state.relationTypes,
    state: state.relationTypeForm
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveRelationType, resetRelationType, resetForm: formActions.reset}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RelationTypeForm);
