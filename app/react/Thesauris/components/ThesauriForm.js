import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { Field, Form, actions as formActions } from 'react-redux-form';
import { connect } from 'react-redux';
import { I18NLink } from 'app/I18N';
import ShowIf from 'app/App/ShowIf';
import { notEmpty } from 'app/Metadata/helpers/validator';
import { Icon } from 'UI';

import FormGroup from 'app/DocumentForm/components/FormGroup';
import { saveThesauri, addValue, removeValue, addGroup, sortValues, moveValues } from 'app/Thesauris/actions/thesauriActions';

export class ThesauriForm extends Component {
  static validation(thesauris, id) {
    return {
      name: {
        duplicated: val => !thesauris.find(thesauri => thesauri._id !== id && thesauri.name.trim().toLowerCase() === val.trim().toLowerCase()),
        required: notEmpty
      }
    };
  }

  constructor(props) {
    super(props);
    this.state = { movingValues: [] };
    this.save = this.save.bind(this);
    this.renderValue = this.renderValue.bind(this);
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
    const addedValue = this.props.thesauri.values.length > previousProps.thesauri.values.length;
    const lasValueIsGroup = this.props.thesauri.values[this.props.thesauri.values.length - 1].values;
    const previousLasValueWasGroup = previousProps.thesauri.values[previousProps.thesauri.values.length - 1].values;
    if (lasValueIsGroup && (!previousLasValueWasGroup || addedValue)) {
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

  moveToGroup(groupIndex) {
    this.props.moveValues(this.state.movingValues, groupIndex);
    this.setState({ movingValues: [] });
  }

  renderGroup(value, groupIndex) {
    return (
      <li key={`group-${groupIndex}`} className="list-group-item sub-group">
        <FormGroup>
          <Field model={`thesauri.data.values[${groupIndex}].label`}>
            <input ref={i => this.groups.push(i)} className="form-control" type="text" placeholder="Group name" />
            <button
              tabIndex={groupIndex + 500}
              type="button"
              className="btn btn-xs btn-danger"
              onClick={this.props.removeValue.bind(null, groupIndex)}
            >
              <Icon icon="trash" /> Delete Group
            </button>
            <button
              tabIndex={groupIndex + 500}
              type="button"
              className="rounded-icon-small"
              alt="move"
              onClick={this.moveToGroup.bind(this, groupIndex)}
            >
              <Icon icon="arrow-left" />
            </button>
          </Field>
        </FormGroup>
        <ul className="">
          {value.values.map((_value, index) => (
              this.renderValue(_value, index, groupIndex)
            ))}
        </ul>
      </li>
    );
  }

  renderValue(value, index, groupIndex) {
    if (value.values) {
      return this.renderGroup(value, index);
    }
    const beenMove = this.beenMove(value) ? 'moving' : '';

    let model = `thesauri.data.values[${index}].label`;
    if (groupIndex !== undefined) {
      model = `thesauri.data.values[${groupIndex}].values[${index}].label`;
    }
    return (
      <li key={`item-${groupIndex || ''}${index}`} className={`list-group-item ${beenMove}`}>
        <FormGroup>
          <Field model={model}>
            <input className="form-control" type="text" placeholder="Item name" />
            <button
              tabIndex={index + 500}
              type="button"
              className="btn btn-xs btn-danger"
              onClick={this.props.removeValue.bind(null, index, groupIndex)}
            >
              <Icon icon="trash" /> Delete
            </button>
            <button
              tabIndex={index + 500}
              type="button"
              className="rounded-icon-small"
              alt="move"
              onClick={this.toggleToMove.bind(this, value)}
            >
              <Icon icon="check" />
        </button>
          </Field>
        </FormGroup>
      </li>
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
                      <Icon icon="exclamation-triangle" />&nbsp;Duplicated name
                    </div>
                  </ShowIf>
                </Field>
              </FormGroup>
            </div>
            <ul className="thesauri-values list-group">
              <li className="list-group-item">
                <b>Items:</b>
                <button
                  tabIndex={500}
                  type="button"
                  className="rounded-icon-small"
                  alt="move"
                  onClick={this.moveToGroup.bind(this)}>
                  <Icon icon="arrow-left" />
                </button>
              </li>
              {values.map((value, index) => this.renderValue(value, index))}
            </ul>
            <div className="settings-footer">
              <I18NLink to="/settings/dictionaries" className="btn btn-default">
                <Icon icon="arrow-left" />
                <span className="btn-label">Back</span>
              </I18NLink>
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
    resetForm: formActions.reset,
    setInitial: formActions.setInitial,
    validate: formActions.validate
  }, dispatch);
}

const form = connect(mapStateToProps, bindActions)(ThesauriForm);

export default form;
