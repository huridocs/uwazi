import React, {Component, PropTypes} from 'react';
import {Field} from 'react-redux-form';
import {connect} from 'react-redux';

import PrioritySortingLabel from './PrioritySortingLabel';

export class FormConfigCommon extends Component {

  render() {
    const {index} = this.props;
    const baseZeroIndex = index + this.props.data.commonProperties.length;

    return (
      <Field model={`template.data.commonProperties[${baseZeroIndex}].prioritySorting`}>
        <input id={'prioritySorting' + this.props.index} type="checkbox" />
        &nbsp;
        <PrioritySortingLabel htmlFor={'prioritySorting' + this.props.index} />
      </Field>
    );
  }
}

FormConfigCommon.propTypes = {
  data: PropTypes.object,
  index: PropTypes.number
};

export function mapStateToProps({template}) {
  return {
    data: template.data
  };
}

export default connect(mapStateToProps)(FormConfigCommon);
