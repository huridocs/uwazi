import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {reduxForm} from 'redux-form';

import {updateTemplate} from '~/Templates/actions/templateActions';

export class FormName extends Component {
  render() {
    const {fields: {name}} = this.props;
    return (
      <form className="" onChange={() => {
        setTimeout(() => {
          this.props.updateTemplate(this.props.values);
        });
      }}>
        <input type="text" {...name}/>
      </form>
    );
  }
}

FormName.propTypes = {
  fields: PropTypes.object,
  updateTemplate: PropTypes.func,
  values: PropTypes.object
};

export function mapStateToProps(state) {
  return {initialValues: {name: state.template.data.toJS().name}};
}

let form = reduxForm({
  form: 'templateName',
  fields: ['name']
},
mapStateToProps,
(dispatch) => {
  return bindActionCreators({updateTemplate}, dispatch);
}
)(FormName);

export default form;
