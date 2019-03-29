import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import React, { Component } from 'react';

import ThesauriFormField from './ThesauriFormField';
import ThesauriFormGroup from './ThesauriFormGroup';

export class ThesauriFormItem extends Component {
  constructor(props) {
    super(props);
    this.focus = () => this.groupItem && this.groupItem.focus();
  }

  render() {
    const { value, index } = this.props;
    if (value.values) {
      return <ThesauriFormGroup ref={f => this.groupItem = f} {...this.props} index={index} />;
    }
    return <ThesauriFormField {...this.props} />;
  }
}

ThesauriFormItem.propTypes = {
  value: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
};

export default connect()(ThesauriFormItem);
