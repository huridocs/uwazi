import React, {Component, PropTypes} from 'react';
import {reduxForm} from 'redux-form';

import {DynamicFields} from 'app/Form';

export class FiltersForm extends Component {

  render() {
    return (
      <form>
        <DynamicFields fields={this.props.fields} template={this.props.properties} />
      </form>
    );
  }
}

FiltersForm.propTypes = {
  fields: PropTypes.object.isRequired,
  properties: PropTypes.array.isRequired
};

export function mapStateToProps(state) {
  let properties = state.library.filters.toJS().properties;
  let fields = properties.map((property) => property.name);
  return {
    fields,
    properties
  };
}

let form = reduxForm({form: 'filters'}, mapStateToProps)(FiltersForm);

export default form;
