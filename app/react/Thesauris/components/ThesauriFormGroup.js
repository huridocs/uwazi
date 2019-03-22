import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Field } from 'react-redux-form';
import { DropTarget } from 'react-dnd';
import { Icon } from 'UI';

import FormGroup from 'app/DocumentForm/components/FormGroup';

import ThesauriFormField from './ThesauriFormField';

export class ThesauriFormGroup extends Component {
  constructor(props) {
    super(props);
    this.focus = () => { this.groupInput.focus(); };
  }

  shouldComponentUpdate(nextProps) {
    return JSON.stringify(nextProps.value) !== JSON.stringify(this.props.value);
  }

  render() {
    const { value, groupIndex, connectDropTarget } = this.props;
    return connectDropTarget(
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
          </Field>
        </FormGroup>
        <ul className="">
          {value.values.map((_value, index) => (
            <ThesauriFormField
              {...this.props}
              value={_value}
              index={index}
              groupIndex={groupIndex}
              key={index}
            />
          ))}
        </ul>
      </li>
    );
  }
}

ThesauriFormGroup.propTypes = {
  value: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    values: PropTypes.array
  }).isRequired,
  groupIndex: PropTypes.number.isRequired,
  removeValue: PropTypes.func.isRequired,
  moveToGroup: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func,
};

ThesauriFormGroup.defaultProps = {
  connectDropTarget: x => x
};

const groupTarget = {
  canDrop() {
    return true;
  },

  drop({ moveToGroup, groupIndex }, monitor) {
    const { value } = monitor.getItem();
    moveToGroup([value], groupIndex);
  }
};

const dropTarget = DropTarget('THESAURI_FORM_ITEM', groupTarget, connector => ({
  connectDropTarget: connector.dropTarget()
}))(ThesauriFormGroup);

export default ThesauriFormGroup;
