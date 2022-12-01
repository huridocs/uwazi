/* eslint-disable max-lines */
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
import { I18NLink, Translate, t } from 'app/I18N';

import { SelectFileButton } from 'app/App/SelectFileButton';
import { ThesauriFormItem } from './ThesauriFormItem';

function sanitizeThesauri(thesaurus) {
  const sanitizedThesauri = { ...thesaurus };
  sanitizedThesauri.values = sanitizedThesauri.values
    .filter(value => value.label)
    .filter(value => !value.values || value.values.length)
    .map(value => {
      const _value = { ...value };
      if (_value.values) {
        _value.values = _value.values.filter(_v => _v.label);
      }
      return _value;
    });
  return sanitizedThesauri;
}

class ThesauriForm extends Component {
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
    this.importThesaurusFile = this.importThesaurusFile.bind(this);
  }

  componentDidMount() {
    this.firstLoad = true;
  }

  componentDidUpdate(previousProps) {
    if (this.firstLoad) {
      this.firstLoad = false;
      return;
    }

    this.addEmptyValueAtTheEnd();

    this.focusIfWasGroup(previousProps);
  }

  componentWillUnmount() {
    this.props.resetForm('thesauri.data');
    this.props.setInitial('thesauri.data');
  }

  onChange(values, groupIndex) {
    this.props.updateValues(values, groupIndex);
  }

  importThesaurusFile(file) {
    const thes = sanitizeThesauri(this.props.thesauri);
    this.props.importThesaurus(thes, file);
  }

  focusIfWasGroup(previousProps) {
    const { values } = this.props.thesauri;
    const previousValues = previousProps.thesauri.values;
    const addedValue = values.length > previousProps.thesauri.values.length;
    const lastValueIsGroup = values.length && values[values.length - 1].values;
    const previousLastValueWasGroup =
      previousValues.length && previousValues[previousValues.length - 1].values;
    if (lastValueIsGroup && (!previousLastValueWasGroup || addedValue)) {
      this.groups[this.groups.length - 1]?.focus();
    }
  }

  addEmptyValueAtTheEnd() {
    this.props.thesauri.values.forEach((value, index) => {
      if (
        value.values &&
        (!value.values.length || value.values[value.values.length - 1].label !== '')
      ) {
        this.props.addValue(index);
      }
    });

    if (
      !this.props.thesauri.values.length ||
      this.props.thesauri.values[this.props.thesauri.values.length - 1].label !== ''
    ) {
      this.props.addValue();
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
                    placeholder={t('System', 'Thesauri name', null, false)}
                  />
                  <ShowIf
                    if={
                      this.props.state.$form.touched &&
                      this.props.state.name &&
                      this.props.state.name.errors.duplicated
                    }
                  >
                    <div className="validation-error">
                      <Icon icon="exclamation-triangle" size="xs" />
                      &nbsp;
                      <Translate>Duplicated name</Translate>
                    </div>
                  </ShowIf>
                </Field>
              </FormGroup>
            </div>
            <div className="thesauri-values">
              <div className="">
                <b>
                  <Translate>Items:</Translate>
                </b>
              </div>
              <DragAndDropContainer
                onChange={this.onChange}
                renderItem={this.renderItem}
                items={values}
                iconHandle
              />
            </div>
            <div className="settings-footer">
              <div className="btn-cluster">
                <BackButton to="/settings/dictionaries" className="btn-plain" />
              </div>
              <div className="btn-cluster lg-margin-left-12 sm-order-1 sm-footer-extra-row">
                <button type="button" className="btn btn-default" onClick={this.props.addGroup}>
                  <Icon icon="plus" />
                  <span className="btn-label">
                    <Translate>Add group</Translate>
                  </span>
                </button>
                <button type="button" className="btn btn-default" onClick={this.props.sortValues}>
                  <Icon icon="sort-alpha-down" />
                  <span className="btn-label">
                    <Translate>Sort</Translate>
                  </span>
                </button>
                <SelectFileButton onFileImported={this.importThesaurusFile} id="import-thesauri">
                  <button type="button" className="btn btn-default import-template">
                    <Icon icon="upload" />
                    <span className="btn-label">
                      <Translate>Import</Translate>
                    </span>
                  </button>
                </SelectFileButton>
              </div>
              <div className="btn-cluster content-right">
                <I18NLink to="/settings/dictionaries" className="btn btn-default btn-extra-padding">
                  <span className="btn-label">
                    <Translate>Cancel</Translate>
                  </span>
                </I18NLink>
                <button type="submit" className="btn btn-success btn-extra-padding save-template">
                  <span className="btn-label">
                    <Translate>Save</Translate>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Form>
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

function mapStateToProps(state) {
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

export { ThesauriForm, mapStateToProps, sanitizeThesauri };

export default connect(mapStateToProps, bindActions, null, { withRef: true })(ThesauriForm);
