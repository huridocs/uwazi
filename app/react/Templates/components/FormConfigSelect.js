import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';

import {updateProperty} from 'app/Templates/actions/templateActions';

export class FormConfigSelect extends Component {
  render() {
    const {fields: {label, content, required, filter}} = this.props;
    return (
      <form className="row" onChange={() => {
        setTimeout(() => {
          this.props.updateProperty(this.props.values, this.props.index);
        });
      }}>
        <div className="form-group col-sm-3">
          <label>Label</label>
          <input className="form-control" type="text" {...label} />
          {label.error && label.touched && <div>{label.error}</div>}
        </div>
        <div className="form-group col-sm-3">
          <label>Content</label>
          <select value="default" className="form-control" type="text" {...content}>
            <option value="default" disabled>Select thesauri</option>
            {this.props.thesauri.map((thesauri) => {
              return <option key={thesauri._id} value={thesauri._id}>{thesauri.name}</option>;
            })}
          </select>
        </div>
        <div className="form-group  col-sm-6">
          Behaviour
          <div>
            <label>
              <input type="checkbox" {...required} /> Required
            </label>
          </div>
          <div>
            <label>
              <input type="checkbox" {...filter}/> Use this field for filtering results
            </label>
          </div>
        </div>
      </form>
    );
  }
}

FormConfigSelect.propTypes = {
  fields: PropTypes.object,
  updateProperty: PropTypes.func,
  values: PropTypes.object,
  thesauri: PropTypes.array,
  index: PropTypes.number
};

const validate = (values) => {
  let errors = {};

  if (!values.label) {
    errors.label = 'Required';
  }

  if (!values.content) {
    errors.content = 'Required';
  }

  return errors;
};

export function mapStateToProps(state, props) {
  return {
    initialValues: state.template.data.toJS().properties[props.index],
    thesauri: state.template.uiState.toJS().thesauri,
    fields: ['label', 'content', 'required', 'filter'],
    validate
  };
}

let form = reduxForm({form: 'template'},
mapStateToProps,
(dispatch) => {
  return bindActionCreators({updateProperty}, dispatch);
}
)(FormConfigSelect);

export default form;
