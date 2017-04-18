import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {Field, Form, actions as formActions} from 'react-redux-form';
import {connect} from 'react-redux';
import {I18NLink} from 'app/I18N';
import ShowIf from 'app/App/ShowIf';
import 'app/Thesauris/scss/thesauris.scss';

import FormGroup from 'app/DocumentForm/components/FormGroup';
import {saveThesauri, addValue, removeValue} from 'app/Thesauris/actions/thesauriActions';

export class ThesauriForm extends Component {

  componentWillUnmount() {
    this.props.resetForm('thesauri.data');
    this.props.setInitial('thesauri.data');
  }

  validation(thesauris, id) {
    return {
      name: {
        duplicated: (val) => {
          return !thesauris.find((thesauri) => {
            return thesauri._id !== id && thesauri.name.trim().toLowerCase() === val.trim().toLowerCase();
          });
        }
      }
    };
  }

  render() {
    let isNew = this.props.new;
    let id = this.props.thesauri._id;
    if (!isNew && !id) {
      return false;
    }

    return (
      <div className="thesauri">
          <Form
            model="thesauri.data"
            onSubmit={this.props.saveThesauri}
            validators={this.validation(this.props.thesauris.toJS(), this.props.thesauri._id)}
          >
            <div className="panel panel-default thesauri">
              <div className="panel-heading">
                <I18NLink to="/settings/dictionaries" className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</I18NLink>
                &nbsp;
                <FormGroup {...this.props.state.name} submitFailed={this.props.state.submitFailed}>
                  <Field model=".name">
                    <input id="thesauriName" className="form-control" type="text" placeholder="Thesauri name" />
                    <ShowIf if={this.props.state.$form.touched && this.props.state.name && this.props.state.name.errors.duplicated}>
                      <div className="validation-error">
                        <i className="fa fa-exclamation-triangle"></i>&nbsp;Duplicated name
                      </div>
                    </ShowIf>
                  </Field>
                </FormGroup>
                &nbsp;
                <button className="btn btn-success save-template">
                  <i className="fa fa-save"/> Save
                </button>
              </div>
              <ul className="thesauri-values list-group">
                <li className="list-group-item"><b>Items:</b></li>
                {this.props.thesauri.values.map((value, index) => {
                  return <li key={index} className="list-group-item">
                          <FormGroup key={index}>
                            <Field model={`thesauri.data.values[${index}].label`}>
                              <input className="form-control" type="text" placeholder="Item name" />
                              <a className="btn btn-xs btn-danger" onClick={this.props.removeValue.bind(null, index)}>
                                <i className="fa fa-trash"></i> Delete
                              </a>
                            </Field>
                          </FormGroup>
                        </li>;
                })}
              </ul>
              <div className="panel-body">
                <a className="btn btn-success" onClick={this.props.addValue}><i className="fa fa-plus"></i>Add item</a>
              </div>
            </div>
          </Form>
      </div>
    );
  }
}

ThesauriForm.propTypes = {
  resetForm: PropTypes.func,
  setInitial: PropTypes.func,
  saveThesauri: PropTypes.func,
  addValue: PropTypes.func,
  removeValue: PropTypes.func,
  thesauris: PropTypes.object,
  thesauri: PropTypes.object,
  state: PropTypes.object,
  new: PropTypes.bool
};

export function mapStateToProps(state) {
  return {
    thesauri: state.thesauri.data,
    thesauris: state.thesauris,
    state: state.thesauri.formState
  };
}

function bindActions(dispatch) {
  return bindActionCreators({
    saveThesauri,
    addValue,
    removeValue,
    resetForm: formActions.reset,
    setInitial: formActions.setInitial,
    validate: formActions.validate
  }, dispatch);
}

let form = connect(mapStateToProps, bindActions)(ThesauriForm);

export default form;
