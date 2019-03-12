import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { Field, Form, actions as formActions } from 'react-redux-form';
import { connect } from 'react-redux';
import ShowIf from 'app/App/ShowIf';
import { notEmpty } from 'app/Metadata/helpers/validator';
import { BackButton } from 'app/Layout';
import { Icon } from 'UI';

import FormGroup from 'app/DocumentForm/components/FormGroup';
import { saveThesauri, addValue, removeValue, addGroup, sortValues, moveValues } from 'app/Thesauris/actions/thesauriActions';
import ThesauriFormField from './ThesauriFormField';

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
    console.log(movingValues);
  }

  moveToGroup(groupIndex) {
    this.props.moveValues(this.state.movingValues, groupIndex);
    this.setState({ movingValues: [] });
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
            <ul className="thesauri-values list-group">
              <li className="list-group-item">
                <b>Items:</b>
                <button
                  tabIndex={500}
                  type="button"
                  className="rounded-icon-small"
                  alt="move"
                  onClick={this.moveToGroup.bind(this, null)}
                >
                  <Icon icon="arrow-left" size="xs" directionAware />
                </button>
              </li>
              {values.map((value, index) => (
                <ThesauriFormField
                  key={index}
                  ref={f => this.groups.push(f)}
                  value={value}
                  index={index}
                  moveToGroup={this.moveToGroup}
                  toggleToMove={this.toggleToMove}
                  removeValue={this.props.removeValue}
                  moving={this.beenMove(value)}
                />
)
              )}
            </ul>
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
