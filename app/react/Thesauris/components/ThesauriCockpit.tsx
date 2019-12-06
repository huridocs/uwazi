/** @format */
import { ThesaurusSchema } from 'api/thesauris/dictionariesType';
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
} from 'app/Thesauris/actions/thesauriActions';
import { boundMethod } from 'autobind-decorator';
import { List } from 'immutable';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  actions as formActions,
  Field,
  FieldAction,
  Form,
  ModelAction,
  ModelGetterFn,
} from 'react-redux-form';
import { bindActionCreators, Dispatch } from 'redux';
import { Icon } from 'UI';

import ThesauriCockpitItem from './ThesauriFormItem';

interface ThesaurusCockpitProps {
  resetForm: (model: string | ModelGetterFn) => ModelAction;
  setInitial: (model: string | ModelGetterFn) => FieldAction;
  saveThesauri: (thesauri: any) => (dispatch: any) => Promise<void>;
  addGroup: () => void;
  addValue: (group: number) => (dispatch: any, getState: any) => void;
  sortValues: () => (dispatch: any, getState: any) => void;
  removeValue: (index: number, groupIndex: any) => (dispatch: any, getState: any) => void;
  updateValues: (updatedValues: any, groupIndex: any) => (dispatch: any, getState: any) => void;
  importThesauri: (thesauri: any, file: any) => (dispatch: any) => Promise<any>;
  thesauris: List<ThesaurusSchema>;
  thesauri: any;
  state: any;
  new?: boolean;
}

function sanitizeThesauri(thesaurus: ThesaurusSchema) {
  const sanitizedThesauri: ThesaurusSchema = { ...thesaurus };
  if (sanitizedThesauri.values) {
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
  }
  return sanitizedThesauri;
}

export class ThesaurusCockpit extends Component<ThesaurusCockpitProps> {
  firstLoad: boolean;

  fileFormRef: React.RefObject<any>;

  fileInputRef: React.RefObject<any>;

  groups: any[];

  static validation(thesaurus: any, id: string) {
    return {
      name: {
        duplicated: (val: { trim: () => { toLowerCase: () => void } }) =>
          !thesaurus.find(
            (thesauri: {
              type: string;
              _id: string;
              name: { trim: () => { toLowerCase: () => void } };
            }) =>
              thesauri.type !== 'template' &&
              thesauri._id !== id &&
              thesauri.name.trim().toLowerCase() === val.trim().toLowerCase()
          ),
        required: notEmpty,
      },
    };
  }

  constructor(props: ThesaurusCockpitProps) {
    super(props);
    this.firstLoad = false;
    this.fileInputRef = React.createRef();
    this.fileFormRef = React.createRef();
    this.groups = [];
  }

  @boundMethod
  componentWillMount() {
    this.firstLoad = true;
  }

  @boundMethod
  componentWillReceiveProps(props: any) {
    props.thesauri.values.forEach((value: { values: { label: string }[] }, index: any) => {
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

  @boundMethod
  componentDidUpdate(previousProps: any) {
    if (this.firstLoad) {
      this.firstLoad = false;
      return;
    }
    const { values = [] } = this.props.thesauri;
    const previousValues = previousProps.thesauri.values;
    const addedValue = values.length > previousProps.thesauri.values.length;
    const lasValueIsGroup = values.length && values[values.length - 1].values;
    const previousLasValueWasGroup =
      previousValues.length && previousValues[previousValues.length - 1].values;
    if (lasValueIsGroup && (!previousLasValueWasGroup || addedValue)) {
      this.groups[this.groups.length - 1].focus();
    }
  }

  @boundMethod
  componentWillUnmount() {
    this.props.resetForm('thesauri.data');
    this.props.setInitial('thesauri.data');
  }

  @boundMethod
  onChange(values: any[], groupIndex: number) {
    this.props.updateValues(values, groupIndex);
  }

  @boundMethod
  onImportClicked() {
    this.fileInputRef.current.click();
  }

  @boundMethod
  import() {
    const file = this.fileInputRef.current.files[0];
    this.fileFormRef.current.reset();
    const thes = sanitizeThesauri(this.props.thesauri);
    if (file) {
      this.props.importThesauri(thes, file);
    }
  }

  @boundMethod
  save(thesaurus: any) {
    const sanitizedThesauri = sanitizeThesauri(thesaurus);
    this.props.saveThesauri(sanitizedThesauri);
  }

  @boundMethod
  renderItem(value: any, index: number) {
    return (
      <ThesauriCockpitItem
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
          validators={ThesaurusCockpit.validation(
            this.props.thesauris.toJS(),
            this.props.thesauri._id
          )}
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

export function mapStateToProps(state: any) {
  return {
    thesauri: state.thesauri.data,
    thesauris: state.thesauris,
    state: state.thesauri.formState,
  };
}

function bindActions(dispatch: Dispatch<any>) {
  return bindActionCreators(
    {
      saveThesauri: saveThesaurus,
      importThesauri: importThesaurus,
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

export default connect(
  mapStateToProps,
  bindActions,
  null,
  { withRef: true }
)(ThesaurusCockpit);
