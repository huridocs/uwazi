import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { Field, Form, actions as formActions } from 'react-redux-form';
import { connect } from 'react-redux';
import { I18NLink } from 'app/I18N';
import ShowIf from 'app/App/ShowIf';
import 'app/Thesauris/scss/thesauris.scss';
import { notEmpty } from 'app/Metadata/helpers/validator';

import FormGroup from 'app/DocumentForm/components/FormGroup';
import { saveThesauri, addValue, removeValue, addGroup } from 'app/Thesauris/actions/thesauriActions';

export class ThesauriForm extends Component {
  static validation(thesauris, id) {
    return {
      name: {
        duplicated: val => !thesauris.find(thesauri => thesauri._id !== id && thesauri.name.trim().toLowerCase() === val.trim().toLowerCase()),
        required: notEmpty
      }
    };
  }

  componentWillReceiveProps(props) {
    props.thesauri.values.forEach((value, index) => {
      if (value.values && value.values[value.values.length - 1].label !== '') {
        props.addValue(index);
      }
    });

    if (props.thesauri.values.length && props.thesauri.values[props.thesauri.values.length - 1].label !== '') {
      props.addValue();
    }
  }

  componentWillUnmount() {
    this.props.resetForm('thesauri.data');
    this.props.setInitial('thesauri.data');
  }

  renderGroup(value, groupIndex) {
    return (
      <ul key={`group-${groupIndex}`} className="sub-group">
        <li className="list-group-item list-group-name">
          <FormGroup>
            <Field model={`thesauri.data.values[${groupIndex}].label`}>
              <input className="form-control" type="text" placeholder="Group name" />
              <button type="button" className="btn btn-xs btn-danger" onClick={this.props.removeValue.bind(null, groupIndex)}>
                <i className="fa fa-trash" /> Delete
              </button>
            </Field>
          </FormGroup>
        </li>
        <li className="list-group-item"><b>Items:</b></li>
        {value.values.map((_value, index) => (
          this.renderValue(_value, index, groupIndex)
        ))}
      </ul>
    );
  }

  renderValue(value, index, groupIndex) {
    if (value.values) {
      return this.renderGroup(value, index);
    }

    let model = `thesauri.data.values[${index}].label`;
    if (groupIndex) {
      model = `thesauri.data.values[${groupIndex}].values[${index}].label`;
    }

    return (
      <li key={`item-${groupIndex || ''}${index}`} className="list-group-item">
        <FormGroup>
          <Field model={model}>
            <input className="form-control" type="text" placeholder="Item name" />
            <button type="button" className="btn btn-xs btn-danger" onClick={this.props.removeValue.bind(null, index, groupIndex)}>
              <i className="fa fa-trash" /> Delete
            </button>
          </Field>
        </FormGroup>
      </li>
    );
  }

  render() {
    const isNew = this.props.new;
    const id = this.props.thesauri._id;
    if (!isNew && !id) {
      return false;
    }

    return (
      <div className="thesauri">
        <Form
          model="thesauri.data"
          onSubmit={this.props.saveThesauri}
          validators={ThesauriForm.validation(this.props.thesauris.toJS(), this.props.thesauri._id)}
        >
          <div className="panel panel-default thesauri">
            <div className="panel-heading">
              <FormGroup {...this.props.state.name} submitFailed={this.props.state.submitFailed}>
                <Field model=".name">
                  <input id="thesauriName" className="form-control" type="text" placeholder="Thesauri name" />
                  <ShowIf if={this.props.state.$form.touched && this.props.state.name && this.props.state.name.errors.duplicated}>
                    <div className="validation-error">
                      <i className="fa fa-exclamation-triangle" />&nbsp;Duplicated name
                    </div>
                  </ShowIf>
                </Field>
              </FormGroup>
            </div>
            <ul className="thesauri-values list-group">
              <li className="list-group-item"><b>Items:</b></li>
              {this.props.thesauri.values.map((value, index) => (
                this.renderValue(value, index)
              ))}
            </ul>
            <div className="settings-footer">
              <I18NLink to="/settings/dictionaries" className="btn btn-default">
                <i className="fa fa-arrow-left" />
                <span className="btn-label">Back</span>
              </I18NLink>
              <a className="btn btn-primary" onClick={this.props.addGroup}>
                <i className="fa fa-plus" />
                <span className="btn-label">Add group</span>
              </a>
              <button className="btn btn-success save-template">
                <i className="fa fa-save"/>
                <span className="btn-label">Save</span>
              </button>
            </div>
          </div>
        </Form>
      </div>
    );
  }
}

ThesauriForm.defaultTypes = {
  new: false
};

ThesauriForm.propTypes = {
  resetForm: PropTypes.func.isRequired,
  setInitial: PropTypes.func.isRequired,
  saveThesauri: PropTypes.func.isRequired,
  addValue: PropTypes.func.isRequired,
  addGroup: PropTypes.func.isRequired,
  removeValue: PropTypes.func.isRequired,
  thesauris: PropTypes.object.isRequired,
  thesauri: PropTypes.object.isRequired,
  state: PropTypes.object.isRequired,
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
    addGroup,
    removeValue,
    resetForm: formActions.reset,
    setInitial: formActions.setInitial,
    validate: formActions.validate
  }, dispatch);
}

const form = connect(mapStateToProps, bindActions)(ThesauriForm);

export default form;
