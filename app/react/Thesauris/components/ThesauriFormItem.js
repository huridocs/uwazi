import PropTypes from 'prop-types';
import React, { Component } from 'react';

import ThesauriFormField from './ThesauriFormField';
import ThesauriFormGroup from './ThesauriFormGroup';

export class ThesauriFormItem extends Component {
  constructor(props) {
    super(props);
    this.focus = () => { this.groupInput.focus(); };
  }

  render() {
    const { value, index } = this.props;
    if (value.values) {
      return <ThesauriFormGroup {...this.props} groupIndex={index} />;
    }
    return <ThesauriFormField {...this.props} />;
  }
}

ThesauriFormItem.propTypes = {
  value: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
};

export default ThesauriFormItem;
