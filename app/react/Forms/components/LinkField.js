import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Translate } from 'app/I18N';

export default class LinkField extends Component {
  constructor(props) {
    super(props);
    this.urlChange = this.urlChange.bind(this);
    this.labelChange = this.labelChange.bind(this);
  }

  onChange(diffValue) {
    const { value, onChange } = this.props;
    const newValue = { ...value, ...diffValue };
    if (!newValue.label && !newValue.url) {
      onChange(null);
      return;
    }
    onChange(newValue);
  }

  urlChange(e) {
    const label = e.target.value;
    this.onChange({ label });
  }

  labelChange(e) {
    const url = e.target.value;
    this.onChange({ url });
  }

  render() {
    const { value } = this.props;
    const { label, url } = value || {};

    return (
      <div className="link form-inline">
        <div className="form-row">
          <div className="form-group">
            <label>
              <Translate>Label</Translate>
            </label>
            <input
              onChange={this.urlChange}
              className="form-control"
              id="label"
              value={label || ''}
              step="any"
            />
          </div>
          <div className="form-group">
            <label>
              <Translate>URL</Translate>
            </label>
            <input
              onChange={this.labelChange}
              className="form-control"
              id="url"
              value={url || ''}
              step="any"
            />
          </div>
        </div>
      </div>
    );
  }
}

LinkField.defaultProps = {
  value: { label: '', url: '' },
};

LinkField.propTypes = {
  value: PropTypes.shape({ label: PropTypes.string, url: PropTypes.string }),
  onChange: PropTypes.func.isRequired,
};
