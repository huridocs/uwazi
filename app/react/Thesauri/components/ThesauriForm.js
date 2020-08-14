/** @format */
import ShowIf from 'app/App/ShowIf';
import FormGroup from 'app/DocumentForm/components/FormGroup';
import { BackButton } from 'app/Layout';
import { DragAndDropContainer } from 'app/Layout/DragAndDrop';
import { notEmpty } from 'app/Metadata/helpers/validator';
import {
  addGroup,
  addValue,
  importThesaurus,
  removeValue,
  saveThesaurus,
  sortValues,
  updateValues,
} from 'app/Thesauri/actions/thesauriActions';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actions as formActions, Field, Form } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { Icon } from 'UI';

import { ThesauriFormItem } from './ThesauriFormItem';

function sanitizeThesauri(thesaurus) {
  const sanitizedThesauri = Object.assign({}, thesaurus);
  sanitizedThesauri.values = sanitizedThesauri.values
    .filter(value => value.label)
    .filter(value => !value.values || value.values.length)
    .map(value => {
      const _value = Object.assign({}, value);
      if (_value.values) {
        _value.values = _value.values.filter(_v => _v.label);
      }
      return _value;
    });
  return sanitizedThesauri;
}

export class ThesauriForm extends Component {
  static validation(thesauris, id) {
    return {
      name: {
        duplicated: val =>
          !thesauris.find(
            thesauri =>
              thesauri.type !== 'template' &&
              thesauri._id !== id &&
              thesauri.name.trim().toLowerCase() === val.trim().toLowerCase()
          ),
        required: notEmpty,
      },
    };
  }

  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
    this.renderItem = this.renderItem.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onImportClicked = this.onImportClicked.bind(this);
    this.import = this.import.bind(this);
    this.fileInputRef = React.createRef();
    this.fileFormRef = React.createRef();
  }

  componentDidMount() {
    this.firstLoad = true;
  }

  componentWillReceiveProps(props) {
    props.thesauri.values.forEach((value, index) => {
      if (
        value.values &&
        (!value.values.length || value.values[value.values.length - 1].label !== '')
      ) {
        props.addValue(index);
      }
    });

    if (
      !props.thesauri.values.length ||
      props.thesauri.values[props.thesauri.values.length - 1].label !== ''
    ) {
      props.addValue();
    }
  }

  componentDidUpdate(previousProps) {
    if (this.firstLoad) {
      this.firstLoad = false;
      return;
    }
    const { values } = this.props.thesauri;
    const previousValues = previousProps.thesauri.values;
    const addedValue = values.length > previousProps.thesauri.values.length;
    const lasValueIsGroup = values.length && values[values.length - 1].values;
    const previousLasValueWasGroup =
      previousValues.length && previousValues[previousValues.length - 1].values;
    if (lasValueIsGroup && (!previousLasValueWasGroup || addedValue)) {
      this.groups[this.groups.length - 1].focus();
    }
  }

  componentWillUnmount() {
    this.props.resetForm('thesauri.data');
    this.props.setInitial('thesauri.data');
  }

  onChange(values, groupIndex) {
    this.props.updateValues(values, groupIndex);
  }

  onImportClicked() {
    this.fileInputRef.current.click();
  }

  import() {
    const file = this.fileInputRef.current.files[0];
    this.fileFormRef.current.reset();
    const thes = sanitizeThesauri(this.props.thesauri);
    if (file) {
      this.props.importThesaurus(thes, file);
    }
  }

  save(thesauri) {
    const sanitizedThesauri = sanitizeThesauri(thesauri);
    this.props.saveThesaurus(sanitizedThesauri);
  }

  renderItem(value, index) {
    return (
      <ThesauriFormItem
        ref={f => this.groups.push(f)}
        value={value}
        index={index}
        removeValue={this.props.removeValue}
        onChange={this.onChange}
      />
    );
  }

  render() {
    const isNew = this.props.new;
    const id = this.props.thesauri._id;
    const { values } = this.props.thesauri;
    if (!isNew && !id) {
      return false;
    }
    this.groups = [];
    return (
      <div className="thesauri">
        <Form
          model="thesauri.data"
          onSubmit={this.save}
          validators={ThesauriForm.validation(this.props.thesauris.toJS(), this.props.thesauri._id)}
        >
          <div className="panel panel-default thesauri">
            <div className="panel-heading">
              <FormGroup {...this.props.state.name} submitFailed={this.props.state.submitFailed}>
                <Field model=".name">
                  <input
                    id="thesauriName"
                    className="form-control"
                    type="text"
                    placeholder="Thesauri name"
                  />
                  <ShowIf
                    if={
                      this.props.state.$form.touched &&
                      this.props.state.name &&
                      this.props.state.name.errors.duplicated
                    }
                  >
                    <div className="validation-error">
                      <Icon icon="exclamation-triangle" size="xs" /> Duplicated name
                    </div>
                  </ShowIf>
                </Field>
              </FormGroup>
            </div>
            <div className="thesauri-values">
              <div className="">
                <b>Items:</b>
              </div>
              <DragAndDropContainer
                onChange={this.onChange}
                renderItem={this.renderItem}
                items={values}
                iconHandle
              />
            </div>
            <div className="settings-footer">
              <BackButton to="/settings/dictionaries" />
              <button type="button" className="btn btn-primary" onClick={this.props.addGroup}>
                <Icon icon="plus" />
                <span className="btn-label">Add group</span>
              </button>
              <button type="button" className="btn btn-primary" onClick={this.props.sortValues}>
                <Icon icon="sort-alpha-down" />
                <span className="btn-label">Sort</span>
              </button>
              <button
                type="button"
                className="btn btn-primary import-template"
                onClick={this.onImportClicked}
              >
                <Icon icon="upload" />
                <span className="btn-label">Import</span>
              </button>
              <button type="submit" className="btn btn-success save-template">
                <Icon icon="save" />
                <span className="btn-label">Save</span>
              </button>
            </div>
          </div>
        </Form>
        <form ref={this.fileFormRef} style={{ display: 'none' }}>
          <input
            ref={this.fileInputRef}
            type="file"
            accept="text/csv"
            style={{ display: 'none' }}
            onChange={this.import}
          />
        </form>
      </div>
    );
  }
}

ThesauriForm.defaultProps = {
  new: false,
};

ThesauriForm.propTypes = {
  resetForm: PropTypes.func.isRequired,
  setInitial: PropTypes.func.isRequired,
  saveThesaurus: PropTypes.func.isRequired,
  addValue: PropTypes.func.isRequired,
  addGroup: PropTypes.func.isRequired,
  sortValues: PropTypes.func.isRequired,
  removeValue: PropTypes.func.isRequired,
  updateValues: PropTypes.func.isRequired,
  importThesaurus: PropTypes.func.isRequired,
  thesauris: PropTypes.object.isRequired,
  thesauri: PropTypes.object.isRequired,
  state: PropTypes.object.isRequired,
  new: PropTypes.bool,
};

export function mapStateToProps(state) {
  return {
    thesauri: state.thesauri.data,
    thesauris: state.thesauris,
    state: state.thesauri.formState,
  };
}

function bindActions(dispatch) {
  return bindActionCreators(
    {
      saveThesaurus,
      importThesaurus,
      addValue,
      addGroup,
      sortValues,
      removeValue,
      updateValues,
      resetForm: formActions.reset,
      setInitial: formActions.setInitial,
      validate: formActions.validate,
    },
    dispatch
  );
}

export default connect(mapStateToProps, bindActions, null, { withRef: true })(ThesauriForm);
