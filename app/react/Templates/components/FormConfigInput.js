import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';

import {updateProperty} from 'app/Templates/actions/templateActions';

export class FormConfigInput extends Component {
  render() {
    const {fields: {label, required, filter}} = this.props;
    return (
      <form className="" onChange={() => {
        setTimeout(() => {
          this.props.updateProperty(this.props.values, this.props.index);
        });
      }}>
        <div className="form-group">
          <label>Label</label>
          <input className="form-control" type="text" {...label} onChange={(e) => {
            label.onChange(e);
          }}/>
          {label.error && label.touched && <div>{label.error}</div>}
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" {...required} /> Required
          </label>
          {required.error && required.touched && <div>{required.error}</div>}
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" {...filter}/> Use this field for filtering results
          </label>
          {filter.error && filter.touched && <div>{filter.error}</div>}
        </div>
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

export function mapStateToProps(state, props) {
  return {initialValues: state.template.data.toJS().properties[props.index]};
}

let form = reduxForm({
  fields: ['label', 'required', 'filter']
},
mapStateToProps,
(dispatch) => {
  return bindActionCreators({updateProperty}, dispatch);
}
)(FormConfigInput);

export default form;
