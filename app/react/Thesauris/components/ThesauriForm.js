import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { Field, Form, actions as formActions } from 'react-redux-form';
import { connect } from 'react-redux';
import { DropTarget, DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragAndDropContainer } from 'app/Layout/DragAndDrop';
import ShowIf from 'app/App/ShowIf';
import { notEmpty } from 'app/Metadata/helpers/validator';
import { BackButton } from 'app/Layout';
import { Icon } from 'UI';

import FormGroup from 'app/DocumentForm/components/FormGroup';
import { saveThesauri, addValue, removeValue, addGroup, sortValues, moveValues, moveValueToIndex, updateValues, updateGroupValues } from 'app/Thesauris/actions/thesauriActions';
import ThesauriFormItem from './ThesauriFormItem';

export class ThesauriForm extends Component {
  static validation(thesauris, id) {
    return {
      name: {
        duplicated: val => !thesauris.find(thesauri => thesauri.type !== 'template' &&
          thesauri._id !== id &&
          thesauri.name.trim().toLowerCase() === val.trim().toLowerCase()),
        required: notEmpty
      }
    };
  }

  constructor(props) {
    super(props);
    this.state = { movingValues: [] };
    this.save = this.save.bind(this);
    this.toggleToMove = this.toggleToMove.bind(this);
    this.moveToGroup = this.moveToGroup.bind(this);
  }

  componentWillMount() {
    this.firstLoad = true;
  }


  componentWillReceiveProps(props) {
    props.thesauri.values.forEach((value, index) => {
      if (value.values && (!value.values.length || value.values[value.values.length - 1].label !== '')) {
        props.addValue(index);
      }
    });

    if (!props.thesauri.values.length || props.thesauri.values[props.thesauri.values.length - 1].label !== '') {
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
    const previousLasValueWasGroup = previousValues.length && previousValues[previousValues.length - 1].values;
    if (lasValueIsGroup && (!previousLasValueWasGroup || addedValue)) {
      console.log('GROUPS', this.groups);
      this.groups[this.groups.length - 1].focus();
    }
  }

  componentWillUnmount() {
    this.props.resetForm('thesauri.data');
    this.props.setInitial('thesauri.data');
  }

  save(thesauri) {
    const sanitizedThesauri = Object.assign({}, thesauri);
    sanitizedThesauri.values = sanitizedThesauri.values
    .filter(value => value.label)
    .filter(value => !value.values || value.values.length)
    .map((value) => {
      const _value = Object.assign({}, value);
      if (_value.values) {
        _value.values = _value.values.filter(_v => _v.label);
      }
      return _value;
    });
    this.props.saveThesauri(sanitizedThesauri);
  }

  beenMove(value) {
    return this.state.movingValues.includes(value);
  }

  toggleToMove(value) {
    let movingValues = this.state.movingValues.slice(0);
    if (movingValues.includes(value)) {
      movingValues = movingValues.filter(v => v !== value);
    } else {
      movingValues.push(value);
    }
    this.setState({ movingValues });
  }

  moveToGroup(values, groupIndex) {
    console.log('moved', values, groupIndex);
    // this.props.moveValues(this.state.movingValues, groupIndex);
    this.props.moveValues(values, groupIndex);
    this.setState({ movingValues: [] });
  }

  childrenToMove(group) {
    if (!group.values) {
      return [];
    }
    const { movingValues } = this.state;
    return movingValues.filter(v => group.values.some(gv => v.id === gv.id));
  }

  removeItem(value) {
    console.log('REMOVED', value);
  }

  onChange(values) {
    console.log('CHANGED', values);
    this.props.updateValues(values);
  }

  onGroupChanged(groupIndex, values) {
    console.log('GROUP CH', groupIndex, values);
    this.props.updateValues(values, groupIndex);
  }

  renderGroup(value, groupIndex) {
    return (
      <div key={`group-${groupIndex}`}>
        <FormGroup>
          <Field model={`thesauri.data.values[${groupIndex}].label`}>
            <div className="input-group">
              <input ref={f => this.groups.push(f)} className="form-control" type="text" placeholder="Group name" />
              <span className="input-group-btn">
                <button
                  tabIndex={groupIndex + 500}
                  type="button"
                  className="btn btn-danger"
                  onClick={this.props.removeValue.bind(null, groupIndex, null)}
                >
                  <Icon icon="trash-alt" /> Delete Group
                </button>
              </span>
            </div>
          </Field>
        </FormGroup>
        <ul className="">
          <DragAndDropContainer
            items={value.values}
            renderItem={(item, index) => this.renderItem(item, index, groupIndex)}
            onChange={this.onGroupChanged.bind(this, groupIndex)}
          />
        </ul>
      </div>
    );
  }

  renderItem(value, index, groupIndex) {
    if (value.values) {
      return this.renderGroup(value, index);
    }
    let model = `thesauri.data.values[${index}].label`;
    if (groupIndex !== undefined) {
      model = `thesauri.data.values[${groupIndex}].values[${index}].label`;
    }
    return (
      <div key={`item-${groupIndex || ''}${index}`}>
        <Field model={model}>
          <div className="input-group">
            <input className="form-control" type="text" placeholder="Item name" />
            <span className="input-group-btn">
              <button
                tabIndex={index + 500}
                type="button"
                className="btn btn btn-danger"
                onClick={this.removeItem.bind(null, value)}
              >
                <Icon icon="trash-alt" /> Delete
              </button>
            </span>
          </div>
        </Field>
      </div>
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
                  <input id="thesauriName" className="form-control" type="text" placeholder="Thesauri name" />
                  <ShowIf if={this.props.state.$form.touched && this.props.state.name && this.props.state.name.errors.duplicated}>
                    <div className="validation-error">
                      <Icon icon="exclamation-triangle" size="xs" /> Duplicated name
                    </div>
                  </ShowIf>
                </Field>
              </FormGroup>
            </div>
            <div className="FiltersForm-constructor">
              <div className="">
                <b>Items:</b>
              </div>
              <DragAndDropContainer
                onChange={this.onChange.bind(this)}
                renderItem={this.renderItem.bind(this)}
                items={values}
              />
              {/* {values.map((value, index) => (
                <ThesauriFormItem
                  key={index}
                  ref={f => this.groups.push(f)}
                  value={value}
                  index={index}
                  moveToGroup={this.moveToGroup}
                  removeValue={this.props.removeValue}
                  moveValueToIndex={this.props.moveValueToIndex}
                />
)
              )} */}
            </div>
            <div className="settings-footer">
              <BackButton to="/settings/dictionaries" />
              <a className="btn btn-primary" onClick={this.props.addGroup}>
                <Icon icon="plus" />
                <span className="btn-label">Add group</span>
              </a>
              <a className="btn btn-primary" onClick={this.props.sortValues}>
                <Icon icon="sort-alpha-down" />
                <span className="btn-label">Sort</span>
              </a>
              <button className="btn btn-success save-template">
                <Icon icon="save"/>
                <span className="btn-label">Save</span>
              </button>
            </div>
          </div>
        </Form>
      </div>
    );
  }
}

ThesauriForm.defaultProps = {
  new: false
};

ThesauriForm.propTypes = {
  resetForm: PropTypes.func.isRequired,
  setInitial: PropTypes.func.isRequired,
  saveThesauri: PropTypes.func.isRequired,
  addValue: PropTypes.func.isRequired,
  addGroup: PropTypes.func.isRequired,
  sortValues: PropTypes.func.isRequired,
  removeValue: PropTypes.func.isRequired,
  moveValues: PropTypes.func.isRequired,
  moveValueToIndex: PropTypes.func.isRequired,
  updateGroupValues: PropTypes.func.isRequired,
  updateValues: PropTypes.func.isRequired,
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
    sortValues,
    removeValue,
    moveValues,
    moveValueToIndex,
    updateGroupValues,
    updateValues,
    resetForm: formActions.reset,
    setInitial: formActions.setInitial,
    validate: formActions.validate
  }, dispatch);
}

export default connect(mapStateToProps, bindActions, null, { withRef: true })(ThesauriForm);
