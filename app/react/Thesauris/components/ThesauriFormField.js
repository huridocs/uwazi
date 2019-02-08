import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Field } from 'react-redux-form';
import { Icon } from 'UI';

import FormGroup from 'app/DocumentForm/components/FormGroup';

export class ThesauriFormField extends Component {
  constructor(props) {
    super(props);
    this.focus = () => { this.groupInput.focus(); };
  }

  shouldComponentUpdate(nextProps) {
    return JSON.stringify(nextProps.value) !== JSON.stringify(this.props.value) || nextProps.moving !== this.props.moving;
  }

  renderGroup(value, groupIndex) {
    return (
      <li key={`group-${groupIndex}`} className="list-group-item sub-group">
        <FormGroup>
          <Field model={`thesauri.data.values[${groupIndex}].label`}>
            <input ref={i => this.groupInput = i} className="form-control" type="text" placeholder="Group name" />
            <button
              tabIndex={groupIndex + 500}
              type="button"
              className="btn btn-xs btn-danger"
              onClick={this.props.removeValue.bind(null, groupIndex, null)}
            >
              <Icon icon="trash-alt" /> Delete Group
            </button>
            <button
              tabIndex={groupIndex + 500}
              type="button"
              className="rounded-icon-small"
              alt="move"
              onClick={this.props.moveToGroup.bind(null, groupIndex, null)}
            >
              <Icon icon="arrow-left" size="xs" />
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
    const moving = this.props.moving ? 'moving' : '';

    let model = `thesauri.data.values[${index}].label`;
    if (groupIndex !== undefined) {
      model = `thesauri.data.values[${groupIndex}].values[${index}].label`;
    }
    return (
      <li key={`item-${groupIndex || ''}${index}`} className={`list-group-item ${moving}`}>
        <FormGroup>
          <Field model={model}>
            <input className="form-control" type="text" placeholder="Item name" />
            <button
              tabIndex={index + 500}
              type="button"
              className="btn btn-xs btn-danger"
              onClick={this.props.removeValue.bind(null, index, groupIndex)}
            >
              <Icon icon="trash-alt" /> Delete
            </button>
            <button
              tabIndex={index + 500}
              type="button"
              className="rounded-icon-small"
              alt="move"
              onClick={this.props.toggleToMove.bind(null, value)}
            >
              <Icon icon="check" size="xs" />
            </button>
          </Field>
        </FormGroup>
      </li>
    );
  }

  render() {
    return this.renderValue(this.props.value, this.props.index);
  }
}

ThesauriFormField.propTypes = {
  removeValue: PropTypes.func.isRequired,
  toggleToMove: PropTypes.func.isRequired,
  value: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  moving: PropTypes.bool.isRequired,
  moveToGroup: PropTypes.func.isRequired,
};

export default ThesauriFormField;
