import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';
import {validateProperty} from 'app/Templates/components/ValidateTemplate';

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
        <div className={'form-group col-sm-3' + (label.touched && label.invalid ? ' has-error' : '')}>
          <label className="control-label">Label</label>
          <input className="form-control" type="text" {...label} />
        </div>
        <div className={'form-group col-sm-3' + (content.touched && content.invalid ? ' has-error' : '')}>
          <label className="control-label">Content</label>
          <select value='' className="form-control" type="text" {...content}>
            <option value='' disabled>Select thesauri</option>
            {this.props.thesauris.map((thesauri) => {
              return <option key={thesauri._id} value={thesauri._id}>{thesauri.name}</option>;
            })}
          </select>
        </div>
        <div className="form-group  col-sm-6">
          Behaviour
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
      </form>
    );
  }
}

FormConfigSelect.propTypes = {
  fields: PropTypes.object,
  updateProperty: PropTypes.func,
  values: PropTypes.object,
  thesauris: PropTypes.array,
  index: PropTypes.number
};

export function mapStateToProps(state, props) {
  let properties = state.template.data.toJS().properties;
  return {
    initialValues: properties[props.index],
    thesauris: state.template.uiState.toJS().thesauris,
    fields: ['label', 'content', 'required', 'filter', 'type'],
    validate: () => {
      return validateProperty(properties[props.index], properties);
    }
  };
}

let form = reduxForm({form: 'template'},
mapStateToProps,
(dispatch) => {
  return bindActionCreators({updateProperty}, dispatch);
}
)(FormConfigSelect);

export default form;
