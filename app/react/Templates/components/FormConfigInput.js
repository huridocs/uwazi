import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';
import {validateProperty} from 'app/Templates/components/ValidateTemplate';

import {updateProperty} from 'app/Templates/actions/templateActions';

export class FormConfigInput extends Component {
  render() {
    const {fields: {label, required, filter}} = this.props;
    return (
      <form className="row" onChange={() => {
        setTimeout(() => {
          this.props.updateProperty(this.props.values, this.props.index);
        });
      }}>
        <div className={'form-group col-sm-3' + (label.touched && label.invalid ? ' has-error' : '')}>
          <label className="control-label">Label</label>
          <input className="form-control" type="text" {...label} onChange={(e) => {
            label.onChange(e);
          }}/>
        </div>
        <div className="col-sm-6">
          Behaviour
          <div className="form-group">
            <div>
              <label className="control-label">
                <input type="checkbox" {...required} /> Required
              </label>
            </div>
            <div>
              <label className="control-label">
                <input type="checkbox" {...filter}/> Use this field for filtering results
              </label>
            </div>
          </div>
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
  return {
    initialValues: state.template.data.toJS().properties[props.index],
    fields: ['label', 'required', 'filter'],
    validate: validateProperty
  };
}

let form = reduxForm({form: 'template'},
mapStateToProps,
(dispatch) => {
  return bindActionCreators({updateProperty}, dispatch);
}
)(FormConfigInput);

export default form;
