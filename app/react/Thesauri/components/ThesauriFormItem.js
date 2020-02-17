import PropTypes from 'prop-types';
import React, { Component } from 'react';

import ThesauriFormField from './ThesauriFormField';
import ThesauriFormGroup from './ThesauriFormGroup';

export class ThesauriFormItem extends Component {
  constructor(props) {
    super(props);
    this.focus = () => this.groupItem && this.groupItem.focus();
  }

  render() {
    const { value } = this.props;
    if (value.values) {
      return (
        <ThesauriFormGroup
          ref={f => {
            this.groupItem = f;
          }}
          {...this.props}
        />
      );
    }
    return <ThesauriFormField {...this.props} />;
  }
}

ThesauriFormItem.propTypes = {
  value: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string,
    values: PropTypes.array,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

export default ThesauriFormItem;
