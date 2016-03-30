import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';
import {updateProperty} from '~/controllers/Templates/templatesActions';

export class FormConfigInput extends Component {
  render() {
    const {fields: {label, required, filter}} = this.props;
    return (
      <form onChange={() => {
        setTimeout(() => {
          this.props.updateProperty(this.props.values, this.props.index);
        });
      }}>
        <label>Label</label>
        <input type="text" {...label} onChange={(e) => {
          label.onChange(e);
        }}/>
        {label.error && label.touched && <div>{label.error}</div>}

        <label>Required</label>
        <input type="checkbox" {...required} />
        {required.error && required.touched && <div>{required.error}</div>}

        <label>Use this field for filtering results</label>
        <input type="checkbox" {...filter}/>
        {filter.error && filter.touched && <div>{filter.error}</div>}
      </form>
    );
  }
}

FormConfigInput.propTypes = {
  fields: PropTypes.object,
  updateProperty: PropTypes.func,
  values: PropTypes.object,
  index: PropTypes.number
};

let form = reduxForm({
  fields: ['label', 'required', 'filter']
},
(state, props) => {
  return {initialValues: state.fields.toJS()[props.index]};
},
(dispatch) => {
  return bindActionCreators({updateProperty}, dispatch);
}
)(FormConfigInput);

export default form;
