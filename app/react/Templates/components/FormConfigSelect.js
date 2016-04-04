import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';

import {updateProperty} from 'app/Templates/actions/templateActions';

export class FormConfigSelect extends Component {
  render() {
    const {fields: {label, content, required, filter}} = this.props;
    return (
      <form className="" onChange={() => {
        setTimeout(() => {
          this.props.updateProperty(this.props.values, this.props.index);
        });
      }}>
        <div className="form-group">
          <label>Label</label>
          <input className="form-control" type="text" {...label} />
          {label.error && label.touched && <div>{label.error}</div>}
        </div>
        <div className="form-group">
          <label>Content</label>
          <select value="default" className="form-control" type="text" {...content}>
            <option value="default" disabled>Select thesauri</option>
            {this.props.thesauri.map((thesauri) => {
              return <option key={thesauri._id} value={thesauri._id}>{thesauri.name}</option>;
            })}
          </select>
          {content.error && content.touched && <div>{content.error}</div>}
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

FormConfigSelect.propTypes = {
  fields: PropTypes.object,
  updateProperty: PropTypes.func,
  values: PropTypes.object,
  thesauri: PropTypes.array,
  index: PropTypes.number
};

export function mapStateToProps(state, props) {
  return {
    initialValues: state.template.data.toJS().properties[props.index],
    thesauri: state.template.uiState.toJS().thesauri
  };
}

let form = reduxForm({
  fields: ['label', 'content', 'required', 'filter']
},
mapStateToProps,
(dispatch) => {
  return bindActionCreators({updateProperty}, dispatch);
}
)(FormConfigSelect);

export default form;
