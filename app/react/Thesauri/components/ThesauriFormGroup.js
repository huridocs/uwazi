import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Field } from 'react-redux-form';
import { DragAndDropContainer } from 'app/Layout/DragAndDrop';
import { Icon } from 'UI';

import FormGroup from 'app/DocumentForm/components/FormGroup';

import ThesauriFormField from './ThesauriFormField';

export class ThesauriFormGroup extends Component {
  constructor(props) {
    super(props);
    this.focus = () => {
      this.groupInput.focus();
    };
    this.renderItem = this.renderItem.bind(this);
    this.onChange = this.onChange.bind(this);
    this.removeGroup = this.removeGroup.bind(this);
  }

  onChange(values) {
    const { index, onChange: onGroupChanged } = this.props;
    onGroupChanged(values, index);
  }

  removeGroup() {
    const { index, removeValue } = this.props;
    removeValue(index);
  }

  renderItem(item, index) {
    const { index: groupIndex } = this.props;
    return <ThesauriFormField {...this.props} value={item} index={index} groupIndex={groupIndex} />;
  }

  render() {
    const { value, index: groupIndex } = this.props;
    return (
      <div key={`group-${groupIndex}`} className="group">
        <FormGroup>
          <Field model={`thesauri.data.values[${groupIndex}].label`}>
            <input
              ref={i => {
                this.groupInput = i;
              }}
              className="form-control"
              type="text"
              placeholder="Group name"
            />
            <button
              tabIndex={groupIndex + 500}
              type="button"
              className="btn btn-xs btn-danger"
              onClick={this.removeGroup}
            >
              <Icon icon="trash-alt" /> Delete Group
            </button>
          </Field>
        </FormGroup>
        <DragAndDropContainer
          items={value.values}
          iconHandle
          renderItem={this.renderItem}
          onChange={this.onChange}
        />
      </div>
    );
  }
}

ThesauriFormGroup.propTypes = {
  value: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    values: PropTypes.array,
  }).isRequired,
  index: PropTypes.number.isRequired,
  removeValue: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ThesauriFormGroup;
