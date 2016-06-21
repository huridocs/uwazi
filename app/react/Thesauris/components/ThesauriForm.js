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
        <main className="col-sm-12">
          <div className="well thesauri">
            <Form
              model="thesauri.data"
              onSubmit={this.props.saveThesauri}
              validators={this.validation(this.props.thesauris.toJS(), this.props.thesauri._id)}
            >
              <div className="thesauri-buttons">
                <Link to="/metadata" className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</Link>&nbsp;
                <button className="btn btn-success save-template">
                  <i className="fa fa-save"/> Save Thesauri
                </button>
              </div>
              <FormGroup {...this.props.state.fields.name} submitFailed={this.props.state.submitFailed}>
              <Field model="thesauri.data.name">
                <label htmlFor="thesauriName" className="control-label">Thesauri name</label>
                <input id="thesauriName" className="form-control" type="text" />
              </Field>
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
              <div>Values</div>
              <div className="thesauri-values">
              {this.props.thesauri.values.map((value, index) => {
                return <FormGroup key={index}>
                        <Field model={`thesauri.data.values[${index}].label`}>
                          <input className="form-control" type="text"/>
                          <a className="btn btn-danger" onClick={this.props.removeValue.bind(null, index)}>Delete</a>
                        </Field>
                      </FormGroup>;
              })}
              </div>
            </Form>
            <button className="btn btn-success" onClick={this.props.addValue}><i className="fa fa-plus"></i>Add value</button>
          </div>
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
