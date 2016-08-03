import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {Field, Form, actions as formActions} from 'react-redux-form';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import 'app/Thesauris/scss/thesauris.scss';

import FormGroup from 'app/DocumentForm/components/FormGroup';
import {saveThesauri, addValue, removeValue} from 'app/Thesauris/actions/thesauriActions';

export class ThesauriForm extends Component {

  componentWillUnmount() {
    this.props.resetForm('thesauri.data');
  }

  validation(thesauris, id) {
    return {
      name: {
        required: (val) => val.trim() !== '',
        duplicated: (val) => {
          return !thesauris.find((thesauri) => {
            return thesauri._id !== id && thesauri.name.trim().toLowerCase() === val.trim().toLowerCase();
          });
        }
      }
    };
  }

  render() {
    return (
      <div className="row thesauri">
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
              <button className="list-group-item">Documents</button>
              <button className="list-group-item">Connections</button>
              <button className="list-group-item active">Thesauris</button>
            </div>
          </div>
        </div>
        <main className="col-xs-12 col-sm-8">
          <Form
            model="thesauri.data"
            onSubmit={this.props.saveThesauri}
            validators={this.validation(this.props.thesauris.toJS(), this.props.thesauri._id)}
          >
            <div className="panel panel-default thesauri">
              <div className="panel-heading">
                <Link to="/metadata" className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</Link>
                &nbsp;
                <Field model="thesauri.data.name">
                  <input id="thesauriName" className="form-control" type="text" placeholder="Thesauri name" />
                </Field>
                &nbsp;
                <button className="btn btn-success save-template">
                  <i className="fa fa-save"/> Save
                </button>
                <FormGroup {...this.props.state.fields.name} submitFailed={this.props.state.submitFailed}>
                {(() => {
                  if (this.props.state.dirty && this.props.state.fields.name && this.props.state.fields.name.errors.duplicated) {
                    return <div className="validation-error">
                              <i className="fa fa-exclamation-triangle"></i>
                              &nbsp;
                              Duplicated name
                          </div>;
                  }
                })()}
                </FormGroup>
              </div>
              <ul className="thesauri-values list-group">
                <li className="list-group-item"><b>Items:</b></li>
                {this.props.thesauri.values.map((value, index) => {
                  return <li className="list-group-item">
                          <FormGroup key={index}>
                            <Field model={`thesauri.data.values[${index}].label`}>
                              <input className="form-control" type="text" placeholder="Item name" />
                              <a className="btn btn-xs btn-danger" onClick={this.props.removeValue.bind(null, index)}>
                                <i className="fa fa-trash"></i> Delete
                              </a>
                            </Field>
                          </FormGroup>
                        </li> ;
                })}
              </ul>
              <div className="panel-body">
                <button className="btn btn-success" onClick={this.props.addValue}><i className="fa fa-plus"></i>Add item</button>
              </div>
            </div>
          </Form>
        </main>
      </div>
    );
  }
}

ThesauriForm.propTypes = {
  resetForm: PropTypes.func,
  saveThesauri: PropTypes.func,
  addValue: PropTypes.func,
  removeValue: PropTypes.func,
  thesauris: PropTypes.object,
  thesauri: PropTypes.object,
  state: PropTypes.object
};

export function mapStateToProps(state) {
  return {
    thesauri: state.thesauri.data,
    thesauris: state.thesauris,
    state: state.thesauri.formState
  };
}

function bindActions(dispatch) {
  return bindActionCreators({saveThesauri, addValue, removeValue, resetForm: formActions.reset}, dispatch);
}

let form = connect(mapStateToProps, bindActions)(ThesauriForm);

export default form;
